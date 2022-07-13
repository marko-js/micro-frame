import StreamGenerator from "../../stream-source/component/StreamGenerator";
import getWritableDOM from "writable-dom";

interface Input {
  slot: string;
  from: string;
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
      this.slotId = ssrEl.dataset.slot;
      this.from = ssrEl.dataset.from;
      ssrEl.removeAttribute("data-slot");
      ssrEl.removeAttribute("data-from");
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
    this.slot?.done();
  },
  async onUpdate() {
    if (
      (this.slotId === this.input.slot && this.from === this.input.from) ||
      !this.slot
    )
      return;

    this.state.loading = true;
    this.state.err = undefined;
    this.slotId = this.input.slot;
    this.from = this.input.from;

    let writable: ReturnType<typeof getWritableDOM> | undefined;
    let err: Error | undefined;

    try {
      writable = getWritableDOM(
        this.el,
        // references the start of the preserved Marko fragment.
        this.el.lastChild!.previousSibling
      );

      const stream = this.slot?.stream;
      for await (const html of stream!) {
        writable.write(html);
      }

      await writable.close();
    } catch (_err) {
      err = _err as Error;
    }

    if (err && !this.input.catch) throw err;
    this.state.loading = false;
    this.state.err = err;
  },
} as {
  id: string;
  input: Input;
  state: State;
  el: HTMLDivElement;
  slotId: string | undefined;
  from: string | undefined;
  slot: StreamGenerator | undefined;
  onUpdate(): unknown;
  onCreate(): unknown;
  onMount(): unknown;
  onDestroy(): unknown;
};
