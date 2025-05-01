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
  content: any;
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
export class Story {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 255 })
  name: string;

  @Column("text")
  content: string;

  @Column("simple-json")
  options: Option[];
}