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
  private _err?: Error;
  private _stream: AsyncGenerator<string>;
  private _loadingSignal: DeferredPrimise =
    StreamGenerator.createDeferredPromise();

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

      if (this._err) {
        throw this._err;
      }

      while (this._buffer.length) {
        yield this._buffer.shift() as string;
      }
    }
  }

  get status() {
    return this._status;
  }

  get stream() {
    return this._stream;
  }

  get loadingSignal() {
    return this._loadingSignal;
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

  done(err?: Error) {
    this._err = err;
    this._status = StreamStatus.CLOSED;
    this._next.resolve && this._next.resolve();
    this._loadingSignal.resolve && this._loadingSignal.resolve();
  }
}

export default StreamGenerator;
