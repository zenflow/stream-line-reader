import { LineMatcher } from "./LineMatcher";

export class NoMatchingLineError extends Error {
  constructor(matcher: LineMatcher, buffer: string[]) {
    super(`Stream ended without matching line
  matcher: ${typeof matcher === "string" ? JSON.stringify(matcher) : matcher}
  lines:\n${buffer.map((line) => `    |${line}`).join("\n")}`);
    Object.setPrototypeOf(this, NoMatchingLineError.prototype);
  }
}
