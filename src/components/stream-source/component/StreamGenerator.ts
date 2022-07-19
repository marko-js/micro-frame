interface DeferredPrimise {
  promise: Promise<string>;
  resolve(value?: unknown): void;
  reject(err: Error): void;
}

enum StreamStatus {
  ACTIVE,
  PAUSED,
  CLOSED,
}

class StreamGenerator {
  private _next: DeferredPrimise = StreamGenerator.createDeferredPromise();
  private _buffer: string[] = [];

  status: StreamStatus = StreamStatus.PAUSED;

  private static createDeferredPromise() {
    const deferred: DeferredPrimise = {} as any;
    deferred.promise = new Promise((_resolve, _reject) => {
      deferred.resolve = _resolve;
      deferred.reject = _reject;
    });
    return deferred;
  }

  private async *generator() {
    if (this._buffer.length) {
      const chunk = this._buffer.join("");
      this._buffer.length = 0;
      yield chunk;
    }
    while (this.status === StreamStatus.ACTIVE) {
      const html = await this._next.promise;
      if (html) yield html;
    }
  }

  stream(): AsyncGenerator<string> {
    if (this.status !== StreamStatus.CLOSED) this.status = StreamStatus.ACTIVE;
    return this.generator();
  }

  push(data: string) {
    if (this._next.resolve && this.status === StreamStatus.ACTIVE) {
      this._next.resolve(data);
      this._next = StreamGenerator.createDeferredPromise();
    } else {
      this._buffer.push(data);
    }
  }

  done() {
    this.status = StreamStatus.CLOSED;
    this._next.resolve();
  }

  throw(err: Error) {
    this.status = StreamStatus.CLOSED;
    this._next.reject(err);
  }
}

export default StreamGenerator;
