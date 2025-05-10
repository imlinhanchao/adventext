import "reflect-metadata";
import http from 'http';
import express from "express";
import authRoutes from "./routes/auth";
import adminRoutes from "./routes/admin";
import homeRoutes from "./routes/home";
import profileRoutes from "./routes/profile";
import configRoutes from "./routes/config";
import path from "path";
import { AppDataSource } from "./entities";
import session from "express-session";
import utils from './utils'
import SessionStore from "session-file-store";

const app = express();
const PORT = process.env.PORT || 3001;
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
  app.use("/auth", authRoutes);
  app.use("/u", profileRoutes);
  app.use("/api", adminRoutes);
  app.use("/", homeRoutes);

  // 数据库连接
  AppDataSource.initialize()
    .then(() => {
      console.log("Database connected");
      listen(app);
    })
    .catch((error) => console.log(error));
} else {
  app.use(configRoutes);
  listen(app);
}

function listen(app: express.Express) {
  const port = utils.config?.webport ?? PORT;
  const server = http.createServer(app);
  server.listen(port);
  server.on('error', (error: any) => {
    if (error.syscall !== 'listen') {
      throw error;
    }

    var bind = typeof port === 'string'
      ? 'Pipe ' + port
      : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        console.error(bind + ' requires elevated privileges');
        process.exit(1);
      case 'EADDRINUSE':
        console.error(bind + ' is already in use');
        process.exit(1);
      default:
        throw error;
    }
  });
  server.on('listening', () => {
    const addr = server.address();
    if (!addr) return;
    const bind = typeof addr === 'string'
      ? 'pipe ' + addr
      : 'port ' + addr.port;
    console.log('Listening on ' + bind);
  });

}