import fetch, { FetchOptions } from "make-fetch-happen";
import { EventEmitter } from "stream";

/**
 * EventSource polyfill for NodeJS
 *
 * This EventSource does not support reconnection due to the content
 * stream is designed to be a short-live connection.
 */
class NodeEventSource extends EventEmitter implements EventSource {
  readonly url: string;
  readonly fetchOpts?: FetchOptions;
  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSED = 2;
  // node-fetch does not support credentials.
  readonly withCredentials: boolean = false;

  get onerror(): ((this: EventSource, ev: Event) => any) | null {
    const listener = this.listeners("error")[0] as any;
    return listener;
  }
  set onerror(listener: ((this: EventSource, ev: Event) => any) | null) {
    this.removeAllListeners("error");
    if (typeof listener === "function") {
      this.addEventListener("error", listener);
    }
  }

  get onmessage(): ((this: EventSource, ev: MessageEvent<any>) => any) | null {
    const listener = this.listeners("message")[0] as any;
    return listener;
  }
  set onmessage(
    listener: ((this: EventSource, ev: MessageEvent<any>) => any) | null
  ) {
    this.removeAllListeners("message");
    if (typeof listener === "function") {
      this.addEventListener("message", listener);
    }
  }

  get onopen(): ((this: EventSource, ev: Event) => any) | null {
    const listener = this.listeners("open")[0] as any;
    return listener;
  }
  set onopen(listener: ((this: EventSource, ev: Event) => any) | null) {
    this.removeAllListeners("open");
    if (typeof listener === "function") {
      this.addEventListener("open", listener);
    }
  }

  private _readyState: number;

  get readyState(): number {
    return this._readyState;
  }

  // Config variables for parsing event stream
  private static bom = [239, 187, 191];
  private static colon = 58;
  private static space = 32;
  private static lineFeed = 10;
  private static carriageReturn = 13;
  // Beyond 256KB we could not observe any gain in performance
  private static maxBufferAheadAllocation = 1024 * 256;

  private static hasBom(buf: Buffer) {
    return NodeEventSource.bom.every(function (charCode, index) {
      return buf[index] === charCode;
    });
  }

  private connect() {
    fetch(this.url, this.fetchOpts).then((res) => {
      if (!res.ok) throw new Error(res.statusText);

      const stream = res.body;

      this._readyState = this.OPEN;
      stream.on("end", () => {
        this.emit("error", new Event("end"));
      });
      this.emit("open", new Event("open"));

      /**
       * Start parsing SSE stream.
       * reference: https://github.com/EventSource/eventsource/blob/master/lib/eventsource.js
       */

      let buf: Buffer | undefined;
      let newBuffer;
      let startingPos = 0;
      let startingFieldLength = -1;
      let newBufferSize = 0;
      let bytesUsed = 0;
      let discardTrailingNewline = false;

      let eventName: string | undefined = "";
      let data = "";
      let lastEventId = "";

      const parseEventStreamLine = (
        buf: Buffer,
        pos: number,
        fieldLength: number,
        lineLength: number
      ) => {
        if (lineLength === 0) {
          if (data.length > 0) {
            const type = eventName || "message";
            this.emit(
              type,
              new MessageEvent(type, {
                data: data.slice(0, -1),
                lastEventId: lastEventId,
                origin: new URL(this.url).origin,
              })
            );
            data = "";
          }
          eventName = undefined;
        } else if (fieldLength > 0) {
          const noValue = fieldLength < 0;
          let step = 0;
          const field = buf
            .slice(pos, pos + (noValue ? lineLength : fieldLength))
            .toString();

          if (noValue) {
            step = lineLength;
          } else if (buf[pos + fieldLength + 1] !== NodeEventSource.space) {
            step = fieldLength + 1;
          } else {
            step = fieldLength + 2;
          }
          pos += step;

          const valueLength = lineLength - step;
          const value = buf.slice(pos, pos + valueLength).toString();

          if (field === "data") {
            data += value + "\n";
          } else if (field === "event") {
            eventName = value;
          } else if (field === "id") {
            lastEventId = value;
          }
        }
      };

      stream.on("data", function (chunk: Buffer) {
        if (!buf) {
          buf = chunk;
          if (buf && NodeEventSource.hasBom(buf)) {
            buf = buf.slice(NodeEventSource.bom.length);
          }
          bytesUsed = buf.length;
        } else {
          if (chunk.length > buf.length - bytesUsed) {
            newBufferSize = buf.length * 2 + chunk.length;
            if (newBufferSize > NodeEventSource.maxBufferAheadAllocation) {
              newBufferSize =
                buf.length +
                chunk.length +
                NodeEventSource.maxBufferAheadAllocation;
            }
            newBuffer = Buffer.alloc(newBufferSize);
            buf.copy(newBuffer, 0, 0, bytesUsed);
            buf = newBuffer;
          }
          chunk.copy(buf, bytesUsed);
          bytesUsed += chunk.length;
        }

        let pos = 0;
        const length = bytesUsed;

        while (pos < length) {
          if (discardTrailingNewline) {
            if (buf[pos] === NodeEventSource.lineFeed) {
              ++pos;
            }
            discardTrailingNewline = false;
          }

          let lineLength = -1;
          let fieldLength = startingFieldLength;
          let c;

          for (let i = startingPos; lineLength < 0 && i < length; ++i) {
            c = buf[i];
            if (c === NodeEventSource.colon) {
              if (fieldLength < 0) {
                fieldLength = i - pos;
              }
            } else if (c === NodeEventSource.carriageReturn) {
              discardTrailingNewline = true;
              lineLength = i - pos;
            } else if (c === NodeEventSource.lineFeed) {
              lineLength = i - pos;
            }
          }

          if (lineLength < 0) {
            startingPos = length - pos;
            startingFieldLength = fieldLength;
            break;
          } else {
            startingPos = 0;
            startingFieldLength = -1;
          }

          parseEventStreamLine(buf, pos, fieldLength, lineLength);

          pos += lineLength + 1;
        }

        if (pos === length) {
          buf = void 0;
          bytesUsed = 0;
        } else if (pos > 0) {
          buf = buf.slice(pos, bytesUsed);
          bytesUsed = buf.length;
        }
      });
    });
  }

  constructor(url: string, opts?: FetchOptions) {
    super();
    this._readyState = this.CONNECTING;
    this.url = url;
    this.fetchOpts = opts;

    this.connect();
  }

  close(): void {
    this._readyState = this.CLOSED;
    this.removeAllListeners();
  }

  addEventListener<K extends keyof EventSourceEventMap>(
    type: K,
    listener: (this: EventSource, ev: EventSourceEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: (this: EventSource, event: MessageEvent<any>) => any,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(type: any, listener: any, options?: any): void {
    if (options && options.once) {
      super.once(type, listener);
    } else {
      super.addListener(type, listener);
    }
  }

  removeEventListener<K extends keyof EventSourceEventMap>(
    type: K,
    listener: (this: EventSource, ev: EventSourceEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: (this: EventSource, event: MessageEvent<any>) => any,
    options?: boolean | EventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;
  removeEventListener(type: any, listener: any): void {
    super.removeListener(type, listener);
  }

  dispatchEvent(event: CustomEvent): boolean {
    if (!event.type) {
      throw new Error("UNSPECIFIED_EVENT_TYPE_ERR");
    }
    return this.emit(event.type, event.detail);
  }
}

export default NodeEventSource;
