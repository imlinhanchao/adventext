export function createFn(...args: any[]) {
  return new Function(...args.slice(0, -1), 'logs', `
    // 捕获 console.log 输出
    logs = logs || []
    const console = ((() => {
      const tranObj = (o) => typeof o == 'string' ? o : JSON.stringify(o);
      return {
        log: (...args) => logs.push({ type: 'log', data: args.map(tranObj).join(' ') }),
        info: (...args) => logs.push({ type: 'info', data: args.map(tranObj).join(' ') }),
        error: (...args) => logs.push({ type: 'error', data: args.map(tranObj).join(' ') }),
        warn: (...args) => logs.push({ type: 'warn', data: args.map(tranObj).join(' ') }),
        debug: (...args) => logs.push({ type: 'debug', data: args.map(tranObj).join(' ') }),
        dir: (data) => logs.push({ type: 'dir', data }),
    }})());
    ${args[args.length - 1]}
  `);
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