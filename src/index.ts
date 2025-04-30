import "reflect-metadata";
import express from "express";
import storyRoutes from "./routes/story";
import authRoutes from "./routes/auth";
import homeRoutes from "./routes/home";
import profileRoutes from "./routes/profile";
import path from "path";
import { AppDataSource } from "./entities";
import session from "express-session";

const app = express();
const PORT = 3000;

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 添加会话支持
app.use(
  session({
    secret: "your-secret-key", // 请替换为更安全的密钥
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // 如果使用 HTTPS，请将其设置为 true
  })
);

// 静态文件服务
app.use(express.static(path.join(__dirname, "..", "public")));

// 设置 EJS 模板引擎
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// 路由
app.use("/profile", profileRoutes);
app.use("/stories", storyRoutes);
app.use("/auth", authRoutes);
app.use("/", homeRoutes);

// 数据库连接
AppDataSource.initialize()
  .then(() => {
    console.log("Database connected");
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => console.log(error));