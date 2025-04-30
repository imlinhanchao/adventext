import "reflect-metadata";
import express from "express";
import storyRoutes from "./routes/story";
import authRoutes from "./routes/auth";
import homeRoutes from "./routes/home";
import profileRoutes from "./routes/profile";
import configRoutes from "./routes/config";
import path from "path";
import { AppDataSource } from "./entities";
import session from "express-session";
import utils from './utils'
import SessionStore from "session-file-store";

const app = express();
const PORT = 3000;
const FileStore = SessionStore(session);

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static(path.join(__dirname, "..", "public")));

// 设置 EJS 模板引擎
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

if (utils.config) {
  // 添加会话支持
  app.use(
    session({
      name: utils.config.secret.identity,
      secret: utils.config.secret.session,
      store: new FileStore(),
      saveUninitialized: false,
      resave: false,
      cookie: { maxAge: 60 * 60 * 24 * 1000 * 365 }, 
    })
  );
  
  // 路由
  app.use("/profile", profileRoutes);
  app.use("/stories", storyRoutes);
  app.use("/auth", authRoutes);
  app.use("/", homeRoutes);
  
  // 数据库连接
  AppDataSource.initialize()
    .then(() => {
      console.log("Database connected");
      const port = utils.config.webport;
      app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
      });
    })
    .catch((error) => console.log(error));
} else {
  app.use(configRoutes);
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}