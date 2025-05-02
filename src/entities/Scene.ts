import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export class Option {
  text: string;
  append?: string;
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
  tip?: string;
}

export class Effect {
  name: string;
  type: string;
  content: string;

  constructor(name: string, type: string, content: string) {
    this.name = name;
    this.type = type;
    this.content = content;
  }

  static getGold(effects: Effect[]): number {
    const goldEffect = effects.find(effect => effect.type === 'Gold');
    return goldEffect ? parseInt(goldEffect.content) : 0;
  }
}

@Entity()
export class Scene {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int', { comment: '故事 ID' })
  storyId: number;

  @Column('varchar', { length: 255, comment: '场景名称' })
  name: string;

  @Column("text", { comment: '场景描述' })
  content: string;

  @Column("json", { comment: '场景选项' })
  options: Option[];

  @Column("json", { comment: '面板位置' })
  position: { x: number, y: number, w?: number, h?: number };
}