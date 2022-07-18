interface DeferredPrimise {
  promise?: Promise<unknown>;
  resolve?(value?: unknown): void;
  reject?(err: Error): void;
}

enum StreamStatus {
  ACTIVE,
  CLOSED,
}

class StreamGenerator {
  private _next: DeferredPrimise = StreamGenerator.createDeferredPromise();
  private _buffer: string[] = [];

  readonly loadingSignal: DeferredPrimise =
    StreamGenerator.createDeferredPromise();
  readonly stream: AsyncGenerator<string>;

  status: StreamStatus = StreamStatus.ACTIVE;

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

      if (this._buffer.length) {
        const chunk = this._buffer.join("");
        this._buffer.length = 0;
        yield chunk;
      }
    }
  }

  constructor() {
    this.stream = this.generator();
  }

  push(data: string) {
    if (this._next.resolve && this.status === StreamStatus.ACTIVE) {
      this._buffer.push(data);
      this._next.resolve();
    }
  }

  done() {
    this.status = StreamStatus.CLOSED;
    this._next.resolve && this._next.resolve();
    this.loadingSignal.resolve && this.loadingSignal.resolve();
  }

  throw(err: Error) {
    this._next.reject && this._next.reject(err);
    this.loadingSignal.resolve && this.loadingSignal.resolve();
  }
}

export default StreamGenerator;
