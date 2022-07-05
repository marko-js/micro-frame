interface DeferredPrimise {
  promise?: Promise<unknown>;
  resolve?(value?: unknown): void;
  reject?(): void;
}

enum StreamStatus {
  ACTIVE,
  CLOSED,
}

class StreamGenerator {
  private _next: DeferredPrimise = StreamGenerator.createDeferredPromise();
  private _status: StreamStatus = StreamStatus.ACTIVE;
  private _buffer: string[] = [];
  private _stream: AsyncGenerator;

  private static createDeferredPromise() {
    const deferred: DeferredPrimise = {};
    deferred.promise = new Promise((_resolve, _reject) => {
      deferred.resolve = _resolve;
      deferred.reject = _reject;
    });
    return deferred;
  }

  private async *generator() {
    while (this.status === StreamStatus.ACTIVE) {
      await this._next.promise;

      this._next = StreamGenerator.createDeferredPromise();

      while (this._buffer.length) {
        yield this._buffer.shift();
      }
    }
  }

  get status() {
    return this._status;
  }

  get stream() {
    return this._stream;
  }

  constructor() {
    this._stream = this.generator();
  }

  push(data: string) {
    if (this._next.resolve && this.status === StreamStatus.ACTIVE) {
      this._buffer.push(data);
      this._next.resolve();
    }
  }

  done() {
    this._status = StreamStatus.CLOSED;
    this._next.resolve && this._next.resolve();
  }
}

export default StreamGenerator;
