import createWritable, { StreamWritable } from "./StreamWritable";

export const STREAM_SOURCE_MAP: Map<string, StreamSource> = new Map();
class StreamSource {
  private readonly _slots: Map<string, StreamWritable>;

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
  }

  async run(parserIterator: AsyncIterator<string[]>) {
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
    return this.getOrCreateSlot(id);
  }

  close(err?: Error) {
    this._slots.forEach((slot: StreamWritable) =>
      err ? slot.error(err) : slot.end()
    );
  }
}

export default StreamSource;
