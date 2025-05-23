import 'reflect-metadata';
import { EventSubscriber, EntitySubscriberInterface, InsertEvent, UpdateEvent, DataSource, Repository } from 'typeorm';
import { Record } from "./Record";
import { Profile } from "./Profile";
import { Draft } from "./Draft";
import { Story } from "./Story";
import { Scene } from "./Scene";
import { Item } from "./Item";
import { End } from "./End";
import { User } from "./User";
import { RankView } from './Rank';
import { ThirdParty } from './ThirdParty';
import utils from '../utils'

@EventSubscriber()
export class EntitySubscriber implements EntitySubscriberInterface {
  beforeInsert(event: InsertEvent<any>): void {
    if (event.entity) {
      const timestamp = Date.now();
      if ('createTime' in event.entity) {
        event.entity.createTime = timestamp;
      }
      if ('updateTime' in event.entity) {
        event.entity.updateTime = timestamp;
      }
    }
  }

  beforeUpdate(event: UpdateEvent<any>): void {
    if (event.entity && 'updateTime' in event.entity) {
      event.entity.updateTime = Date.now();
    }
  }
}

export const AppDataSource = utils.config ? new DataSource({
  type: "mysql",
  ...utils.config.database,
  synchronize: true,
  logging: false,
  entities: [Record, Profile, User, Story, Scene, Draft, Item, End, RankView, ThirdParty],
  migrations: [],
  subscribers: [],
  charset: "utf8mb4_unicode_ci"
}) : {} as DataSource;

export {
  Record,
  Profile,
  User,
  Story,
  Draft,
  Scene,
  Item,
  End,
  ThirdParty
}

export const RecordRepo = utils.config ? AppDataSource.getRepository(Record) : {} as Repository<Record>;
export const ProfileRepo = utils.config ? AppDataSource.getRepository(Profile) : {} as Repository<Profile>;
export const UserRepo = utils.config ? AppDataSource.getRepository(User) : {} as Repository<User>;
export const StoryRepo = utils.config ? AppDataSource.getRepository(Story) : {} as Repository<Story>;
export const DraftRepo = utils.config ? AppDataSource.getRepository(Draft) : {} as Repository<Draft>;
export const SceneRepo = utils.config ? AppDataSource.getRepository(Scene) : {} as Repository<Scene>;
export const ItemRepo = utils.config ? AppDataSource.getRepository(Item) : {} as Repository<Item>;
export const EndRepo = utils.config ? AppDataSource.getRepository(End) : {} as Repository<End>;
export const RankRepo = utils.config ? AppDataSource.getRepository(RankView) : {} as Repository<RankView>;
export const ThirdPartyRepo = utils.config ? AppDataSource.getRepository(ThirdParty) : {} as Repository<ThirdParty>;