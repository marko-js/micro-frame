import createWritable, { StreamWritable } from "./StreamWritable";

export const STREAM_SOURCE_MAP_CLIENT: Map<string, StreamSource> = new Map();
class StreamSource {
  private readonly _slots: Map<string, StreamWritable>;
  private _closed: boolean;

  private getOrCreateSlot(id: string): StreamWritable {
    if (this._slots.has(id)) {
      return this._slots.get(id) as StreamWritable;
    }

    const newSlot = createWritable();
    this._slots.set(id, newSlot);
    return newSlot;
  }

  constructor() {
    this._slots = new Map();
    this._closed = false;
  }

  async run(parserIterator: AsyncIterator<[string, string, boolean?]>) {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { value, done } = await parserIterator.next();

      if (done) break;

      const [slotId, html, isDone] = value;
      const slot = this.getOrCreateSlot(slotId);
      slot.write(html);
      isDone && slot.end();
    }

    this.close();
  }

  slot(id: string) {
    return this._closed ? this._slots.get(id) : this.getOrCreateSlot(id);
  }

  close(err?: Error) {
    this._closed = true;
    this._slots.forEach((slot: StreamWritable) =>
      err ? slot.error(err) : slot.end()
    );
  }
}

export default StreamSource;
