export function createFn(...args: any[]) {
  return new Function(...args);
}

export function callFn(fn: Function, ...args: any[]) {
  return fn(...args);
}

export function tryEval(code: string) {
  try {
    return createFn('return ' + code)();
  } catch (_) {
    return code;
  }
}