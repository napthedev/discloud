import crypto from "crypto";

export const randomId = (length = 16) =>
  crypto.randomBytes(length).toString("hex");
