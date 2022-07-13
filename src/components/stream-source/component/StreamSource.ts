import StreamGenerator from "./StreamGenerator";

class StreamSource {
  private readonly _slots: Map<string, StreamGenerator>;

  private getOrCreateSlot(id: string): StreamGenerator {
    if (this._slots.has(id)) {
      return this._slots.get(id) as StreamGenerator;
    }

    const newSlot = new StreamGenerator();
    this._slots.set(id, newSlot);
    return newSlot;
  }

  constructor() {
    this._slots = new Map();
  }

  private validRead(tuple: any) {
    return (
      Array.isArray(tuple) &&
      tuple.filter(Boolean).length === 2 &&
      typeof tuple[0] === "string" &&
      typeof tuple[1] === "string"
    );
  }

  async run(parserIterator: AsyncGenerator<string[]>) {
    for await (const readTuple of parserIterator) {
      if (!this.validRead(readTuple)) {
        const err = new Error("[Parser Iterator] Invalid parser function.");
        this.close(err);
        throw err;
      }

      const [slotId, html] = readTuple;
      const slot = this.getOrCreateSlot(slotId);
      slot.push(html);
    }
    this.close();
  }

  slot(id: string) {
    return this.getOrCreateSlot(id);
  }

  close(err?: Error) {
    this._slots.forEach((slot: StreamGenerator) => slot.done(err));
  }
}

export default StreamSource;
