import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Inventory } from './Profile';
import { Effect, IAttribute, Option } from './Scene';

@Entity({ comment: '故事草稿'})
export class Draft {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ comment: "作者用户名" })
  author: string;

  @Column('varchar', { length: 255, comment: '故事名称 ' })
  name: string;

  @Column('varchar', { length: 128, default: '', comment: '别名' })
  alias: string;

  @Column('json', { nullable: true, comment: '共享用户列表' })
  shareUser?: string[];

  @Column('varchar', { length: 255, comment: '起始场景' })
  start: string;

  @Column('varchar', { length: 500, comment: '描述' })
  description: string;

  @Column('json', { comment: '人物初始化属性' })
  attr: Record<string, any> | IAttribute[];

  @Column('json', { comment: '属性名称' })
  attrName: { [key: string]: [string, string] | string } | { key: string; name: string; }[] = [];

  @Column('json', { comment: '初始化物品' })  
  inventory: Inventory[];

  @Column("json", { nullable: true, comment: '全局选项' })
  options?: Option[];

  @Column("json", { nullable: true, comment: '全局效果，达成条件后触发' })
  effects?: Effect[];
  
  @Column("text", { nullable: true, comment: '全局自定义样式' })
  customStyle: string;
  
  @Column('int', { default: 0, comment: '故事状态: 0 - 草稿，1 - 推送，2 - 发布，3 - 下架' })
  status: number;

  @Column('varchar', { length: 1024, comment: '未通过原因', default: '' })
  comment: string;
  
  @Column('bigint', { comment: "创建时间" })
  createTime: number = 0;
  
  @Column('bigint', { comment: "更新时间" })
  updateTime: number = 0;

  constructor() {
    this.name = '';
    this.description = '';
    this.attr = {};
    this.attrName = {};
    this.inventory = [];
    this.status = 0;
  }
}