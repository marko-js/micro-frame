import StreamGenerator from "./StreamGenerator";

class StreamSource {
  // Using index signature instead of defining property
  // for low babel version compatibility
  [x: string]: any;

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

  async run(parserIterator: AsyncGenerator<string[]>) {
    for await (const [slotId, html] of parserIterator) {
      if (!slotId) throw new Error("[Parser Iterator] Invalid Slot ID");

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
