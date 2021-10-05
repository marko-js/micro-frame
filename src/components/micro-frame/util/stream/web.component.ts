import getWritableDOM from "../writable-dom";

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

export = class {
  input!: Input;
  state!: State;
  el!: HTMLDivElement;
  src: string | undefined;
  controller?: AbortController;
  onCreate() {
    this.state = {
      loading: false,
      err: undefined,
    };
  }
  onMount() {
    // Only trigger a new load if this wasn't ssr'd, or the src has changed.
    this.src = this.el.dataset.ssr;
    this.el.removeAttribute("data-ssr");
    this.onUpdate();
  }
  onDestroy() {
    this.controller?.abort();
  }
  async onUpdate() {
    if (this.src === this.input.src) return;

    this.controller?.abort();
    this.state.loading = true;
    this.state.err = undefined;
    this.src = this.input.src;
    const controller = (this.controller = new AbortController());

    try {
      const res = await fetch(this.src, {
        cache: this.input.cache,
        signal: controller.signal,
        headers: {
          ...this.input.headers,
          accept: "text/html",
        },
      });
      if (!res.ok) throw new Error(res.statusText);
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      const writable = getWritableDOM({
        target: this.el,
        signal: controller.signal,
        // references the start of the preserved Marko fragment.
        previousSibling: this.el.lastChild!.previousSibling,
        onLoad: () => {
          this.state.loading = false;
        },
      });

      let value: Uint8Array | undefined;
      while ((value = (await reader.read()).value)) {
        writable.write(decoder.decode(value));
      }

      writable.close();
    } catch (err) {
      if (controller === this.controller) {
        this.state.loading = false;
        this.state.err = err as Error;
        if (!this.input.catch) throw err;
      }
    }
  }
};
