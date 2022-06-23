import StreamGenerator from "./StreamGenerator";

type StreamDispatcher = (ev: MessageEvent) => [string, string];

class StreamSlot {
  private readonly _streamGenerator: StreamGenerator;

  constructor() {
    this._streamGenerator = new StreamGenerator();
  }

  get stream() {
    return this._streamGenerator.stream;
  }

  push(data: string) {
    this._streamGenerator.push(data);
    return this;
  }

  done() {
    this._streamGenerator.done();
  }
}

class StreamSource {
  private readonly _slots: Map<string, StreamSlot>;
  private readonly _read: StreamDispatcher;

  private getOrCreateSlot(id: string): StreamSlot {
    if (this._slots.has(id)) {
      return this._slots.get(id) as StreamSlot;
    }

    const newSlot = new StreamSlot();
    this._slots.set(id, newSlot);
    return newSlot;
  }

  constructor(read: StreamDispatcher) {
    this._slots = new Map();
    this._read = read;
  }

  read(
    ev: MessageEvent,
    opts?: {
      closeAfterRead?: boolean;
    }
  ) {
    const res = this._read(ev);

    const slotId = res[0];
    if (!slotId) throw new Error("Invalid Slot ID");

    const slot = this.getOrCreateSlot(slotId);
    const data = res[1];

    slot.push(data);

    opts?.closeAfterRead && slot.done();
  }

  slot(id: string) {
    return this.getOrCreateSlot(id);
  }

  close() {
    this._slots.forEach((slot) => slot.done());
    this._slots.clear();
  }
}

export { StreamDispatcher, StreamSlot, StreamSource };
