import 'reflect-metadata';
import { EventSubscriber, EntitySubscriberInterface, InsertEvent, UpdateEvent, DataSource } from 'typeorm';
import { Record } from "./Record";
import { Profile } from "./Profile";
import { Draft } from "./Draft";
import { Story } from "./Story";
import { Scene } from "./Scene";
import { Item } from "./Item";
import { End } from "./End";
import { User } from "./User";
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
  entities: [Record, Profile, User, Story, Scene, Draft, Item, End],
  migrations: [],
  subscribers: [],
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
}