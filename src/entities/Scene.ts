import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export class Option {
  id?: string;
  text: string;
  append?: string;
  antiAppend?: string; 
  next: string;
  loop?: number;
  disabled?: boolean;
  value?: string;
  conditions?: Condition[];
  effects?: Effect[];

  constructor(text: string, next: string, conditions?: Condition[], effects?: Effect[]) {
    this.text = text;
    this.next = next;
    this.conditions = conditions;
    this.effects = effects;
  }
}

export class Condition {
  type: string;
  name: string;
  content: any;
  tip: string;
  operator?: string;
  isHide: boolean = false;
}

export class Effect {
  type: string;
  name: string;
  operator?: string;
  content: string;
  tip?: string;
  conditions?: Condition[];

  constructor(name: string, type: string, content: string) {
    this.name = name;
    this.type = type;
    this.content = content;
  }
}

export class IAttribute {
  key: string;
  name: string;
  type: string;
  value: any;

  constructor(key: string, name: string, type: string, value: any) {
    this.key = key;
    this.name = name;
    this.type = type;
    this.value = value;
  }
}


@Entity({ comment: '场景'})
export class Scene {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 255, comment: '故事 ID' })
  storyId: string;

  @Column('varchar', { length: 255, comment: '场景名称' })
  name: string;

  @Column("text", { comment: '场景描述' })
  content: string;

  @Column("json", { comment: '场景选项' })
  options: Option[];

  @Column("varchar", { length: 255, comment: '结局名称' })
  theEnd: string;

  @Column({ comment: '是否结局' })
  isEnd: boolean;

  @Column("json", { comment: '面板位置' })
  position: { x: number, y: number, w?: number, h?: number };

  @Column("text", { nullable: true, comment: '自定义样式' })
  customStyle: string;

  @Column({ comment: '场景渲染模式', default: 0 })
  renderMode: number = 0;

  @Column("simple-array", { comment: '场景标签' })
  tags: string[] = [];

  @Column("json", { comment: '场景属性' })
  attributes: IAttribute[];

  @Column('bigint', { comment: "创建时间" })
  createTime: number = 0;
  
  @Column('bigint', { comment: "更新时间" })
  updateTime: number = 0;
}