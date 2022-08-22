import createWritable, { StreamWritable } from "./StreamWritable";

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

  // Parser(read) should return correct format: [slotId: string, html: string, ifDone?: boolean]
  private validRead(arr: any) {
    return (
      Array.isArray(arr) &&
      typeof arr[0] === "string" &&
      typeof arr[1] === "string" &&
      (typeof arr[2] === "undefined" || typeof arr[2] === "boolean")
    );
  }

  async run(parserIterator: AsyncIterator<string[]>) {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { value, done } = await parserIterator.next();

      if (done) break;

      if (!this.validRead(value)) {
        throw new Error("[Parser Iterator] Invalid parser function.");
      }

      const [slotId, html, ifDone] = value;
      const slot = this.getOrCreateSlot(slotId);
      slot.write(html);
      ifDone && slot.end();
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
