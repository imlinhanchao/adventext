import { Router } from "express";
import fs from "fs";
import path from "path";
import { render } from "../utils/route";

const randomStr = () => randomUp(Math.random().toString(36).slice(2));
const randomUp = (s: string) => s.split('').map((s) => Math.floor(Math.random() * 10) % 2 ? s : s.toUpperCase()).join('');

const router = Router();

router.get("/", (req, res) => {
  render(res, "config").title('初始化配置').render();
});

router.post("/", (req, res) => {
  const { name, webport, host, port, username, password, database } = req.body;
  
  const config = {
    name, webport, secret: {
      identity: '_SESSION_ID_' + randomStr(),
      session: randomStr(),
      jwt: randomStr(),
    },
    database: {
      host, port, username, password, database,
    }
  }

  fs.writeFileSync(path.join(__dirname, "..", "config.json"), JSON.stringify(config, null, 2));

  render(res, "config")
    .title('初始化配置')
    .success('配置成功, 请稍后刷新')
    .location('/')
    .render();

  setTimeout(() => {
    process.exit(0);
  }, 200);
});

export default router;
