import "reflect-metadata";
import express from "express";
import { DataSource } from "typeorm";
import storyRoutes from "./routes/storyRoutes";
import authRoutes from "./routes/authRoutes";
import homeRoutes from "./routes/homeRoutes";
import path from "path";

const app = express();
const PORT = 3000;

export const AppDataSource = new DataSource({
  type: "mysql",
  host: "hancel.org",
  port: 3306,
  username: "hancel",
  password: "root_`1qw23",
  database: "game",
  synchronize: true,
  logging: false,
  entities: ["src/entities/*.ts"],
  migrations: [],
  subscribers: [],
});

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use("/assets", express.static(path.join(__dirname, "public/assets")));

// 设置 EJS 模板引擎
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// 路由
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