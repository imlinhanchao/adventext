import fs from 'fs';
import path from "path";

export function omit(obj: any, keys: string[]) {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !keys.includes(key))
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