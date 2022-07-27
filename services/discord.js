import axios from "axios";
import FormData from "form-data";
import axiosRetry from "axios-retry";

// Discord has a rate limit of 5 requests / 5 seconds
// So we must queue the upload
let uploadingCount = 0;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Auto retry to prevent rate limit error from discord
axiosRetry(axios, { retryDelay: axiosRetry.exponentialDelay, retries: 5 });

export const uploadToDiscord = async (webhookURL, chunk, fileName) => {
  await wait(uploadingCount++ * 1000);

  const formData = new FormData();

  formData.append("file", chunk, { filename: fileName });

  const result = (
    await axios
      .post(webhookURL, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .finally(() => uploadingCount--)
  ).data;

  return result.attachments[0].url;
};
