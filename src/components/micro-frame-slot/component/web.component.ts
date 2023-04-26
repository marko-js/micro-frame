import { StreamWritable } from "../../stream-source/component/StreamWritable";
import StreamSource from "../../stream-source/component/StreamSource";
import getWritableDOM from "writable-dom";
import { getOrCreateStreamSource } from "../../stream-source/component/helper";

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
    this.streamSource = getOrCreateStreamSource(this.input.from);
    this.streamSource.onInvalidate(this.handleSrcChange.bind(this));
    this.onUpdate();
  },
  handleSrcChange(src: string) {
    this.curSrc = src;
    this.forceUpdate();
  },
  onDestroy() {
    this.slot?.end();
    this.streamSource.offInvalidate(this.handleSrcChange);
  },
  async onUpdate() {
    if (
      this.slotId === this.input.slot &&
      this.from === this.input.from &&
      this.prevSrc === this.curSrc
    )
      return;

    this.state.loading = true;
    this.state.err = undefined;
    this.slotId = this.input.slot;
    this.from = this.input.from;
    this.prevSrc = this.curSrc;

    let writable: ReturnType<typeof getWritableDOM> | undefined;
    let err: Error | undefined;

    try {
      this.slot = this.streamSource.slot(this.slotId);

      if (!this.slot) {
        return;
      }

      writable = getWritableDOM(
        this.el,
        // references the start of the preserved Marko fragment.
        this.el.lastChild!.previousSibling
      );

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { value, done } = await this.slot.next();
        if (done) break;
        writable.write(value);
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
  prevSrc: string | undefined;
  curSrc: string | undefined;
  slot: StreamWritable | undefined;
  streamSource: StreamSource;
  onUpdate(): unknown;
  onCreate(): unknown;
  onMount(): unknown;
  onDestroy(): unknown;
  forceUpdate(): unknown;
  handleSrcChange(src: string): unknown;
};
