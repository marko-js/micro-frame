const kReadableByName = Symbol("stream-source");

type InvalidateHandler = (newSrc: string) => void;
interface DeferredPromise extends Promise<void> {
  resolve: () => void;
  reject: (reason: any) => void;
}

export type StreamWritable = AsyncIterator<string> & {
  write(data: string): void;
  error(reason: unknown): void;
  end(): void;
};

export class StreamSource {
  private readonly _slots = new Map<string, StreamWritable>();
  private _invalidateHandlers = new Set<InvalidateHandler>();
  private _closed = false;

  private getOrCreateSlot(id: string): StreamWritable {
    if (this._slots.has(id)) {
      return this._slots.get(id) as StreamWritable;
    }

    const newSlot = createWritable();
    this._slots.set(id, newSlot);
    return newSlot;
  }

  async run(parserIterator: AsyncIterator<string[]>) {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { value, done } = await parserIterator.next();

      if (done) break;

      if (value === undefined) {
        continue;
      }

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

  onInvalidate(handler: InvalidateHandler) {
    this._invalidateHandlers.add(handler);
  }

  offInvalidate(handler: InvalidateHandler) {
    this._invalidateHandlers.delete(handler);
  }

  invalidate(newSrc: string) {
    this._slots.clear();
    this._closed = false;
    for (const handler of this._invalidateHandlers) {
      handler(newSrc);
    }
  }
}

export function getSource(name: string, out?: any): StreamSource {
  const global: any = typeof document === "object" ? window : out?.global;
  if (global === undefined) {
    throw new Error("Server side out.global is missing.");
  }
  const store = (global[kReadableByName] ??= new Map());
  if (store.has(name)) {
    return store.get(name) as StreamSource;
  }

  const streamSource = new StreamSource();
  store.set(name, streamSource);
  return streamSource;
}

export function createWritable(): StreamWritable {
  let buf = "";
  let done = false;
  let error: unknown = undefined;
  let pending: DeferredPromise | undefined = undefined;

  return {
    write(data: string) {
      buf += data;
      if (pending) {
        pending.resolve();
        pending = undefined;
      }
    },
    end() {
      done = true;
      if (pending) {
        pending.resolve();
        pending = undefined;
      }
    },
    error(reason: unknown) {
      error = reason;
      done = true;
      buf = "";

      if (pending) {
        pending.reject(reason);
        pending = undefined;
      }
    },
    async next() {
      if (error) {
        throw error;
      }

      if (buf) {
        const value = buf;
        buf = "";
        return {
          value,
          done: false,
        };
      }

      if (done) {
        return {
          value: undefined,
          done: true,
        };
      }

      await (pending = createDeferred());
      return this.next();
    },
  };
}

function createDeferred() {
  let resolve!: () => void;
  let reject!: (reason: any) => void;
  const p = new Promise<void>((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  }) as DeferredPromise;
  p.resolve = resolve;
  p.reject = reject;
  return p;
}
