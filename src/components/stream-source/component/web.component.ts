import StreamSource from "./StreamSource";

interface Input {
  src: string;
  name: string;
  parser(readable: AsyncGenerator): AsyncGenerator<string[]>;
  method?: string;
  body?: JSON;
  catch?: unknown;
  timeout?: number;
  loading?: unknown;
  cache?: RequestCache;
  headers?: Record<string, string>;
}

interface State {
  loading: boolean;
  err: undefined | Error;
}

async function* readableToGenerator(readable: ReadableStream) {
  const reader = readable.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    yield decoder.decode(value);
  }
}

export = {
  onCreate() {
    const ssrEl = document.getElementById(this.id);
    let loading = true;
    if (ssrEl) {
      this.src = ssrEl.dataset.src;
      ssrEl.removeAttribute("data-src");
      ssrEl.removeAttribute("id");
      loading = false;
    }

    this.state = {
      loading,
      err: undefined,
    };
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
    this.state.loading = true;
    this.state.err = undefined;
    this.src = this.input.src;
    const controller = (this.controller = new AbortController());
    let err: Error | undefined;

    try {
      const res = await fetch(this.input.src, {
        method: this.input.method,
        body: JSON.stringify(this.input.body),
        headers: this.input.headers,
        cache: this.input.cache,
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(res.statusText);
      const readable = readableToGenerator(res.body!);
      await this.streamSource.run(this.input.parser(readable));
    } catch (_err) {
      err = _err as Error;
      this.streamSource.close(err);
    }

    if (controller === this.controller) {
      if (err && !this.input.catch) throw err;
      this.state.loading = false;
      this.state.err = err;
    }
  },
} as {
  id: string;
  input: Input;
  state: State;
  streamSource: StreamSource;
  el: HTMLDivElement;
  src: string | undefined;
  method: string | undefined;
  controller: AbortController | undefined;
  onUpdate(): unknown;
  onCreate(): unknown;
  onMount(): unknown;
  onDestroy(): unknown;
};
