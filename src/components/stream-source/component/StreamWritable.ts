interface DeferredPromise extends Promise<void> {
  resolve: () => void;
  reject: (reason: any) => void;
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

export type StreamWritable = AsyncIterator<string> & {
  write(data: string): void;
  error(reason: unknown): void;
  end(): void;
};

function createWritable(): StreamWritable {
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

export default createWritable;
