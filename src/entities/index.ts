import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { GameState } from "./GameState";
import { Story } from "./Story";
import { User } from "./User";

export const AppDataSource = new DataSource({
  type: "mysql",
  host: "hancel.org",
  port: 3306,
  username: "hancel",
  password: "root_`1qw23",
  database: "game",
  synchronize: true,
  logging: false,
  entities: [GameState, Story, User],
  migrations: [],
  subscribers: [],
});
