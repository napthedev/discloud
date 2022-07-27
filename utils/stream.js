import { Transform } from "stream";

// https://github.com/forscht/ddrive/blob/3.x/src/utils/asyncStreamProcessor.js
export class AsyncStreamProcessor extends Transform {
  constructor(chunkProcessor) {
    super();
    this.chunkProcessor = chunkProcessor;
  }

  _transform(chunk, encoding, callback) {
    this.chunkProcessor(chunk)
      .then(() => callback(null))
      .catch((err) => callback(err));
  }
}
