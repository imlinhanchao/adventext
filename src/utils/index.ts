import fs from 'fs';
import path from "path";
import { isObject } from './is';

export function omit(obj: any, keys: string[]) {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !keys.includes(key))
  );
}

export function pick(obj: any, keys: string[]) {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => keys.includes(key))
  );
}

let cfg: any = null
const configPath = path.join(__dirname, '..', 'config.json');

export default {
  get config(): any {
    if (!cfg && fs.existsSync(configPath)) {
      cfg = JSON.parse(fs.readFileSync(configPath).toString());
    }
    return JSON.parse(JSON.stringify(cfg));
  }
}

export function clone<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => clone(item)) as unknown as T;
  }
  if (isObject(value)) {
    const target: any = {};
    for (const key in value) {
      target[key] = clone(value[key]);
    }
    return target;
  }
  return value;
}

export function shortTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);
  const remainingSeconds = seconds % 60;

  return `${days} 天 ${hours} 小时 ${minutes} 分钟 ${remainingSeconds} 秒`;
}