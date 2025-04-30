import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Record } from "./Record";
import { State } from "./State";
import { Story } from "./Story";
import { User } from "./User";
import utils from '../utils'

export const AppDataSource = utils.config ? new DataSource({
  type: "mysql",
  ...utils.config.database,
  synchronize: true,
  logging: false,
  entities: [Record, State, Story, User],
  migrations: [],
  subscribers: [],
}) : {} as DataSource;

export {
  Record,
  State,
  Story,
  User
}