import path from "path";
import fetch, { FetchInterface } from "make-fetch-happen";

export type CacheTypes =
  | "default"
  | "no-store"
  | "reload"
  | "force-cache"
  | "only-if-cached";

export default async (
  req: { protocol: string; headers: Record<string, string> },
  src: string,
  options?: {
    headers?: Record<string, string>;
    cache?: CacheTypes;
    fetch?: FetchInterface;
    timeout?: number;
  }
) => {
  const url = new URL(src, `${req.protocol}://${req.headers.host}`);
  const res = await (options?.fetch || fetch)(url.toString(), {
    cachePath: path.resolve("node_modules/.cache/fetch"),
    cache: options?.cache,
    strictSSL: process.env.NODE_TLS_REJECT_UNAUTHORIZED !== "0",
    headers: {
      ...req.headers,
      ...options?.headers,
    },
    timeout: options?.timeout,
  });

  if (!res.ok) throw new Error(res.statusText);

  return res;
};
