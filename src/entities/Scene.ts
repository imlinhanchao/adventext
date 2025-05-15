import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export class Option {
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
  name: string;
  type: string;
  operator?: string;
  content: string;

  constructor(name: string, type: string, content: string) {
    this.name = name;
    this.type = type;
    this.content = content;
  }
}

@Entity()
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

  @Column('bigint', { comment: "创建时间" })
  createTime: number = 0;
  
  @Column('bigint', { comment: "更新时间" })
  updateTime: number = 0;
}