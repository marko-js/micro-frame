import StreamSource from "../stream-source/component/StreamSource";
import request, { CacheTypes } from "../stream-source/component/request";
import { FetchInterface } from "make-fetch-happen";
import { ReadFunction } from "./parser";
import parser from "./parser";

export default class {
  STREAM_SOURCE_MAP_SERVER = new Map();
  request;

  constructor(req: any) {
    this.request = req;
  }

  async stream(
    name: string,
    src: string,
    options?: {
      headers?: Record<string, string>;
      cache?: CacheTypes;
      fetch?: FetchInterface;
      timeout?: number;
      read?: ReadFunction;
    }
  ) {
    const streamSource = new StreamSource();
    this.STREAM_SOURCE_MAP_SERVER.set(name, streamSource);

    try {
      const { body } = await request(
        this.request,
        src,
        options && {
          headers: options.headers,
          cache: options.cache,
          fetch: options.fetch,
          timeout: options.timeout,
        }
      );
      await streamSource.run(
        parser(options?.read)(body[Symbol.asyncIterator]())
      );
    } catch (error) {
      streamSource.close(error as Error);
    }
    return;
  }
}
