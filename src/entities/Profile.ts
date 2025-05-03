import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Item } from './Item';

export class Inventory extends Item {
  /**
   * 物品数量
   */
  count: number;
}

@Entity()
export class Profile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int', { comment: '用户ID' })
  userId: number;

  @Column('int', { comment: '故事 ID' })
  storyId: number;

  @Column('varchar', { length: 255, comment: '当前场景' })
  scene: string;

  @Column('varchar', { length: 255, comment: '来源场景' })
  from: string;

  @Column('json', { comment: '物品栏' })
  inventory: Inventory[];

  @Column('json', { comment: '属性' })
  attr: any;

  @Column('json', { comment: '属性名称' })
  attrName: { [key: string]: [string, string] | string } = {}

  @Column('int', { comment: '结局 ID' })
  endId: number;

  @Column({ comment: '已经结局' })
  isEnd: boolean;

  constructor(user: number, storyId: number) {
    this.userId = user;
    this.storyId = storyId;
    this.scene = '';
    this.from = '';
    this.inventory = [];
    this.attr = {};
    this.attrName = {};
    this.endId = Date.now() / 1000;
    this.isEnd = false;
  }
}