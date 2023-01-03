import StreamSource, { STREAM_SOURCE_MAP_CLIENT } from "./StreamSource";

interface Input {
  src: string;
  fetch?(input: RequestInfo, init?: RequestInit): Promise<Response>;
  name: string;
  parser(readable: AsyncIterator<string>): AsyncIterator<string[]>;
  method?: string;
  body?: JSON;
  timeout?: number;
  cache?: RequestCache;
  headers?: Record<string, string>;
}

function readableToAsyncIterator(
  readable: ReadableStream
): AsyncIterator<string> {
  const reader = readable.getReader();
  const decoder = new TextDecoder();
  return {
    async next() {
      const { value, done } = await reader.read();
      if (done) {
        return {
          value: undefined,
          done,
        };
      }
      return {
        value: decoder.decode(value),
        done,
      };
    },
  };
}

export = {
  onCreate(input) {
    const ssrEl = document.getElementById(this.id);
    if (ssrEl) {
      this.src = ssrEl.dataset.src;
      ssrEl.removeAttribute("data-src");
      ssrEl.removeAttribute("id");
    } else {
      const streamSource = new StreamSource();
      STREAM_SOURCE_MAP_CLIENT.set(input.name, streamSource);
      this.streamSource = streamSource;
    }
  },
  onMount() {
    // Only trigger a new load if this wasn't ssr'd, or the src has changed.
    this.onUpdate();
  },
  onDestroy() {
    this.controller?.abort();
  },
  async onUpdate() {
    if (this.src === this.input.src || !this.streamSource) return;

    this.controller?.abort();
    this.src = this.input.src;
    const controller = (this.controller = new AbortController());
    let err: Error | undefined;

    try {
      const res = await (this.input.fetch || fetch)(this.input.src, {
        method: this.input.method,
        body: JSON.stringify(this.input.body),
        headers: this.input.headers,
        cache: this.input.cache,
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(res.statusText);
      const readable = readableToAsyncIterator(res.body!);
      await this.streamSource.run(this.input.parser(readable));
    } catch (_err) {
      err = _err as Error;
      this.streamSource.close(err);
    }
  },
} as {
  id: string;
  input: Input;
  streamSource: StreamSource;
  el: HTMLDivElement;
  src: string | undefined;
  method: string | undefined;
  controller: AbortController | undefined;
  onUpdate(): unknown;
  onCreate(input: Input): unknown;
  onMount(): unknown;
  onDestroy(): unknown;
};
