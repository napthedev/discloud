import axios from "axios";
import FormData from "form-data";
import axiosRetry from "axios-retry";
import { wait } from "../utils/time.js";

const client = axios.create();

// Discord has a rate limit of 5 requests / 5 seconds
// So we must queue the upload
let uploadingCount = 0;

// Auto retry to prevent rate limit error from discord
axiosRetry(client, {
  retryDelay: (retryCount) => retryCount * 1000,
  retries: 3,
});

export const uploadToDiscord = async (
  token,
  channelId,
  file,
  fileName,
  hasRetried = false
) => {
  await wait(uploadingCount++ * 1000);

  const formData = new FormData();

  formData.append("files[0]", file, { filename: fileName });

  const result = (
    await client
      .post(
        `https://discord.com/api/channels/${channelId}/messages`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bot ${token}`,
          },
        }
      )
      .catch(async (err) => {
        if (
          !hasRetried &&
          err?.response?.headers?.["x-ratelimit-reset-after"]
        ) {
          await wait(+err.response.headers["x-ratelimit-reset-after"] * 1000);

          return await uploadToDiscord(token, channelId, file, fileName, true);
        } else {
          throw err;
        }
      })
      .finally(() => uploadingCount--)
  ).data;

  return result.attachments[0].url;
};
