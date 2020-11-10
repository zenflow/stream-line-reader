export type LineMatcher = string | RegExp | ((line: string) => boolean);

export function matcherToTestFn(matcher: LineMatcher): (line: string) => boolean {
  if (typeof matcher === "function") {
    return matcher;
  }
  if (typeof matcher === "string") {
    return (line) => line === matcher;
  }
  if (matcher instanceof RegExp) {
    return (line) => matcher.test(line);
  }
  throw new TypeError("Matcher must be a string, a regex, or a function");
}
