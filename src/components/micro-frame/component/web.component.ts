import getWritableDOM from "writable-dom";

interface Input {
  src: string;
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
    if (this.src === this.input.src) return;

    this.controller?.abort();
    this.state.loading = true;
    this.state.err = undefined;
    this.src = this.input.src;
    const controller = (this.controller = new AbortController());
    let writable: ReturnType<typeof getWritableDOM> | undefined;
    let err: Error | undefined;

    try {
      const res = await fetch(this.src, {
        cache: this.input.cache,
        signal: controller.signal,
        headers: Object.assign({}, this.input.headers, { accept: "text/html" }),
      });
      if (!res.ok) throw new Error(res.statusText);
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      writable = getWritableDOM(
        this.el,
        // references the start of the preserved Marko fragment.
        this.el.lastChild!.previousSibling
      );

      let value: Uint8Array | undefined;
      while ((value = (await reader.read()).value)) {
        writable.write(decoder.decode(value));
      }

      await writable.close();
    } catch (_err) {
      err = _err as Error;
      writable?.abort(err);
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
  el: HTMLDivElement;
  src: string | undefined;
  controller: AbortController | undefined;
  onUpdate(): unknown;
  onCreate(): unknown;
  onMount(): unknown;
  onDestroy(): unknown;
};
