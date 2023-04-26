import StreamSource from "./StreamSource";

const streamSourceMapKey = Symbol("stream-source");
export const getOrCreateStreamSource = (
  name: string,
  out?: Marko.Out
): StreamSource => {
  const global: any = typeof document === "object" ? window : out?.global;
  if (global === undefined) {
    throw new Error("Server side out.global is missing.");
  }
  const store = (global[streamSourceMapKey] ??= new Map());
  if (store.has(name)) {
    return store.get(name) as StreamSource;
  }

  const streamSource = new StreamSource();
  store.set(name, streamSource);
  return streamSource;
};
