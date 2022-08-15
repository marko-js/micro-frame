class StreamGenerator {
  private declare _next: DeferredPromise<boolean>;
  private _buffer: Array<string | Error> = [];
  private _pending = true;
  private _done = false;

  private async *generator() {
    while (!this._done && (await this._next?.promise)) {
      this._pending = false;
      this._next = createDeferredPromise();
      if (this._buffer.length) {
        yield this.readBuffer();
      }
    }

    if (this._buffer.length) {
      yield this.readBuffer();
    }
  }

  readBuffer() {
    let chunk = "";
    for (const buf of this._buffer) {
      if (buf instanceof Error) {
        throw buf;
      } else {
        chunk += buf;
      }
    }
    this._buffer.length = 0;
    return chunk;
  }

  stream(): AsyncGenerator<string> {
    this._pending = false;
    this._next = createDeferredPromise();
    return this.generator();
  }

  push(data: string) {
    this._buffer.push(data);
    if (!this._pending) {
      this._pending = true;
      this._next.resolve(true);
    }
  }

  done() {
    this._done = true;
    !this._pending && this._next?.resolve(false);
  }

  throw(err: Error) {
    if (this._pending) {
      this._buffer.push(err);
    } else {
      this._next.reject(err);
    }
  }
}

interface DeferredPromise<T> {
  promise: Promise<T>;
  resolve(value?: unknown): void;
  reject(err: Error): void;
}

function createDeferredPromise<T>() {
  const deferred = {} as DeferredPromise<T>;
  deferred.promise = new Promise((_resolve, _reject) => {
    deferred.resolve = _resolve;
    deferred.reject = _reject;
  });
  return deferred;
}

export default StreamGenerator;
