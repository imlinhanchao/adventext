import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Record } from "./Record";
import { Profile } from "./Profile";
import { Story } from "./Story";
import { Item } from "./Item";
import { Skill } from "./Skill";
import { User } from "./User";
import utils from '../utils'

export const AppDataSource = utils.config ? new DataSource({
  type: "mysql",
  ...utils.config.database,
  synchronize: true,
  logging: false,
  entities: [Record, Profile, User, Story, Item, Skill],
  migrations: [],
  subscribers: [],
}) : {} as DataSource;

export {
  Record,
  Profile,
  User,
  Story,
  Item,
  Skill,
}