import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Item } from './Item';
import { Inventory } from './Profile';

@Entity()
export class Story {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 255, comment: '故事名称 ' })
  name: string;

  @Column('varchar', { length: 255, comment: '起始场景' })
  start: string;

  @Column('varchar', { length: 500, comment: '描述' })
  description: string;

  @Column('json', { comment: '人物初始化属性' })
  attr: any;

  @Column('json', { comment: '属性名称' })
  attrName: { [key: string]: [string, string] | string };

  @Column('json', { comment: '初始化物品' })
  inventory: Inventory[];
  

  constructor() {
    this.name = '';
    this.description = '';
    this.attr = {};
    this.attrName = {};
  }
}