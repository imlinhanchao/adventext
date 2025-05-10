import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Inventory } from './Profile';

@Entity()
export class Draft {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ comment: "作者用户名" })
  author: string;

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
  
  @Column('bigint', { comment: "创建时间" })
  creatTime: number = 0;
  
  @Column('bigint', { comment: "更新时间" })
  updateTime: number = 0;

  constructor() {
    this.name = '';
    this.description = '';
    this.attr = {};
    this.attrName = {};
    this.inventory = [];
  }
}