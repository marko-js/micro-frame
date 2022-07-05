import StreamGenerator from "./StreamGenerator";

class StreamSource {
  private readonly _slots: Map<string, StreamGenerator> = new Map();

  private getOrCreateSlot(id: string): StreamGenerator {
    if (this._slots.has(id)) {
      return this._slots.get(id) as StreamGenerator;
    }

    const newSlot = new StreamGenerator();
    this._slots.set(id, newSlot);
    return newSlot;
  }

  async run(
    parserIterator: AsyncGenerator<string[]>,
    opts?: {
      closeAfterRead?: boolean;
    }
  ) {
    for await (const [slotId, html] of parserIterator) {
      if (!slotId) throw new Error("[Parser Iterator] Invalid Slot ID");

      const slot = this.getOrCreateSlot(slotId);
      slot.push(html);
      opts?.closeAfterRead && slot.done();
    }
  }

  slot(id: string) {
    return this.getOrCreateSlot(id);
  }

  close() {
    this._slots.forEach((slot) => slot.done());
    this._slots.clear();
  }
}

export default StreamSource;
