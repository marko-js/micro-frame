import StreamGenerator from "./StreamGenerator";

class StreamSource {
  // Add index signature for low version babel compatibility
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

  close() {
    this._slots.forEach((slot: StreamGenerator) => slot.done());
    this._slots.clear();
  }
}

export default StreamSource;
