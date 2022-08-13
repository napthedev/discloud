import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { createClient } from "redis";
import { uploadToDiscord } from "./services/discord.js";
import { randomId } from "./utils/id.js";
import { AsyncStreamProcessor } from "./utils/stream.js";
import { formatFileName } from "./utils/string.js";
import { wait } from "./utils/time.js";

dotenv.config();
const app = express();

// Redis connection
const client = createClient({
  url: process.env.REDIS_URL,
});

client.on("error", (err) => {
  console.log("Failed to connect to Redis", err);
  process.exit(1);
});

await client.connect();
console.log("Connected to Redis database");

// Constants
const CHUNK_SIZE = 8388608; // 8 MB
const RANGE_SIZE = 5242880; // 5 MB

const token = process.env.DISCORD_BOT_TOKEN;
const channelId = process.env.DISCORD_CHANNEL_ID;
if (!token || !channelId)
  throw new Error("Missing discord bot token or channel id");

app.enable("trust proxy");
app.use(cors());

app.get("/", async (req, res) => {
  res.sendFile(path.resolve("./static/index.html"));
});

app.post("/upload", async (req, res) => {
  try {
    let chunks = [];
    let uploadedParts = [];
    let fill = 0;
    let uploadedCount = 0;
    let requestEnded = false;
    let fileSize = 0;
    let filesToUpload = [];

    if (!req.query.fileName)
      return res.status(400).send({
        message: "Missing fileName query param",
      });

    const fileName = formatFileName(req.query.fileName);

    req.on("data", (chunk) => {
      chunks.push(chunk);

      // Current length of total chunks
      fill += chunk.length;

      fileSize += chunk.length;

      // While current length is greater than max chunk size
      // Use while instead of if because there can be chunks that are twice or three times bigger than the max chunk size
      while (fill >= CHUNK_SIZE) {
        // Create a new chunk with that exact size
        const newChunk = Buffer.concat(chunks, CHUNK_SIZE);

        // Get the residue of the last chunk after creating a new chunk
        const lastChunk = chunks.slice(-1)[0];
        const residueLength = fill - CHUNK_SIZE;

        // Set the chunks arr with the remaining from the last chunk
        chunks =
          residueLength === 0
            ? []
            : [Buffer.from(lastChunk.slice(-residueLength))];

        fill = residueLength;

        filesToUpload.push(newChunk);
      }
    });

    req.on("end", async () => {
      // Add the final chunks if there is any left-over
      requestEnded = true;
      if (chunks.length > 0) {
        const newChunk = Buffer.concat(chunks);

        filesToUpload.push(newChunk);
      }
    });

    while (filesToUpload.length > 0 || !requestEnded) {
      if (filesToUpload.length === 0) {
        await wait(200);
      } else {
        const url = await uploadToDiscord(
          token,
          channelId,
          filesToUpload.splice(0, 1)[0],
          `${fileName}-chunk-${++uploadedCount}`
        );
        uploadedParts.push(url);
      }
    }

    const fileId = randomId();
    await client.set(
      fileId,
      JSON.stringify({
        chunkSize: CHUNK_SIZE,
        fileName,
        fileSize,
        parts: uploadedParts,
      })
    );
    res.send({
      fileId,
      fileSize,
      url: `${req.protocol}://${req.get("host")}/file/${fileId}`,
      longURL: `${req.protocol}://${req.get(
        "host"
      )}/file/${fileId}/${fileName}`,
      downloadURL: `${req.protocol}://${req.get(
        "host"
      )}/file/${fileId}?download=1`,
      longDownloadURL: `${req.protocol}://${req.get(
        "host"
      )}/file/${fileId}/${fileName}?download=1`,
      parts: uploadedParts,
    });
  } catch (error) {
    console.log(error?.response?.data ? error.response.data : error);
    if (!res.headersSent)
      res.status(500).send({
        message: "Internal server error",
        error,
      });
  }
});

app.get(["/file/:id/*", "/file/:id"], async (req, res) => {
  try {
    let info = await client.get(req.params.id);

    if (!info) return res.status(404).send("Cannot find the specified file");

    info = JSON.parse(info);

    res.setHeader("Content-Length", info.fileSize);
    res.setHeader("Accept-Ranges", "bytes");

    if (+req.query.download) {
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${info.fileName}"`
      );
    }

    res.contentType(info.fileName.split(".").slice(-1)[0]);

    // Parse the range header if client is requesting a video
    const rangeStr = req.headers.range;

    const start = rangeStr ? +rangeStr.split("=")[1].split("-")[0] : null;

    const end = rangeStr
      ? +rangeStr.split("=")[1].split("-")[1]
        ? +rangeStr.split("=")[1].split("-")[1]
        : start + RANGE_SIZE >= info.fileSize - 1
        ? info.fileSize - 1
        : start + RANGE_SIZE
      : null;

    const partsToDownload = rangeStr
      ? (() => {
          const startPartNumber = Math.ceil(start / info.chunkSize)
            ? Math.ceil(start / info.chunkSize) - 1
            : 0;
          const endPartNumber = Math.ceil(end / info.chunkSize);

          const partsToDownload = info.parts
            .map((part) => ({ url: part }))
            .slice(startPartNumber, endPartNumber);

          partsToDownload[0].start = start % info.chunkSize;
          partsToDownload[partsToDownload.length - 1].end =
            end % info.chunkSize;

          res.status(206);
          res.setHeader("Content-Length", end - start + 1);
          res.setHeader(
            "Content-Range",
            `bytes ${start}-${end}/${info.fileSize}`
          );

          return partsToDownload;
        })()
      : info.parts.map((part) => ({ url: part }));

    for (const part of partsToDownload) {
      // Discord CDN supports range, so we will use that to chunk the file first
      const headers =
        part.start || part.end
          ? { Range: `bytes=${part.start || 0}-${part.end || ""}` }
          : {};
      await new Promise((resolve, reject) => {
        axios
          .get(part.url, { headers, responseType: "stream" })
          .then((response) => {
            response.data.pipe(
              new AsyncStreamProcessor(async (data) => {
                if (!res.write(data))
                  await new Promise((r) => res.once("drain", r));
              })
            );
            response.data.on("error", (err) => reject(err));
            response.data.on("end", () => resolve());
          });
      });
    }

    res.end();
  } catch (error) {
    if (!res.headersSent)
      res.status(500).send({
        message: "Internal server error",
        error,
      });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () =>
  console.log(`Server is listening on port ${port}. http://localhost:${port}`)
);
