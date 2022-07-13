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

  // Parser(read) should return correct format: [slotId: string, html: string, ifDone?: boolean]
  private validRead(arr: any) {
    return (
      Array.isArray(arr) &&
      typeof arr[0] === "string" &&
      typeof arr[1] === "string" &&
      (typeof arr[2] === "undefined" || typeof arr[2] === "boolean")
    );
  }

  async run(parserIterator: AsyncGenerator<string[]>) {
    for await (const result of parserIterator) {
      if (!this.validRead(result)) {
        throw new Error("[Parser Iterator] Invalid parser function.");
      }

      const [slotId, html, ifDone] = result;
      const slot = this.getOrCreateSlot(slotId);
      slot.push(html);
      ifDone && slot.done();
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
