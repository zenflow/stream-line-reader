/// <reference types="node"/>

import { pipeline } from "stream";
import split from "split";
import merge from "merge-stream";
import { scanStream } from "./scanStream";
import { LineMatcher, matcherToTestFn } from "./LineMatcher";
import { NoMatchingLineError } from "./NoMatchingLineError";

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

export class StreamLineReader {
  public readonly stream: NodeJS.ReadableStream;
  private _streamError: Error | null = null;
  private _isStreamEnded = false;
  private _buffer: string[] = [];
  private _isReading = false;
  private _isReadingEnded = false;

  public constructor(streams: NodeJS.ReadableStream | NodeJS.ReadableStream[]) {
    const streamsArray = Array.isArray(streams) ? streams : [streams];
    const splitStreams = streamsArray.map((stream) =>
      pipeline(stream.setEncoding("utf8"), split(), noop)
    );
    this.stream = splitStreams.length > 1 ? merge(splitStreams) : splitStreams[0];
    this.stream.once("error", (error) => {
      this._streamError = error;
    });
    this.stream.once("end", () => {
      this._isStreamEnded = true;
    });
    this.stream.on("data", (line: string) => {
      this._buffer.push(line);
    });
  }

  private _assertPreRead() {
    if (this._streamError) throw this._streamError;
    if (this._isReading) throw new Error("Cannot read while another read is in progress");
    if (this._isReadingEnded) throw new Error("Cannot read after readRemaining() has been called");
  }

  public readBuffered(): string[] {
    this._assertPreRead();
    return this._buffer.splice(0, this._buffer.length);
  }

  public async readUntil(matcher: LineMatcher): Promise<string[]> {
    try {
      return await this._readUntil(matcher);
    } catch (error) {
      if (error instanceof NoMatchingLineError) {
        Error.captureStackTrace(error, this.readUntil);
      }
      throw error;
    }
  }
  private _readUntil(matcher: LineMatcher): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      this._assertPreRead();
      const test = matcherToTestFn(matcher);
      const bufferIndex = this._buffer.findIndex(test);
      if (bufferIndex > -1) {
        return resolve(this._buffer.splice(0, bufferIndex + 1));
      }
      if (this._isStreamEnded) {
        return reject(new NoMatchingLineError(matcher, this._buffer));
      }
      this._isReading = true;
      scanStream(this.stream, test, (error, found) => {
        this._isReading = false;
        if (error) {
          return reject(error);
        }
        if (!found) {
          return reject(new NoMatchingLineError(matcher, this._buffer));
        }
        resolve(this._buffer.splice(0, this._buffer.length));
      });
    });
  }

  public readRemaining(): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      this._assertPreRead();
      const done = () => {
        this._isReadingEnded = true;
        resolve(this._buffer.splice(0, this._buffer.length));
      };
      if (this._isStreamEnded) {
        return done();
      }
      this._isReading = true;
      const test = () => false;
      scanStream(this.stream, test, (error) => {
        this._isReading = false;
        if (error) {
          return reject(error);
        }
        done();
      });
    });
  }
}
