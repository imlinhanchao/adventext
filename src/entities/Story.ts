import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export class Option {
  text: string;
  append?: string;
  next: string;
  once?: boolean;
  disabled?: boolean;
  condition?: Condition;
  effect?: Effect;

  constructor(text: string, next: string, condition?: Condition, effect?: Effect) {
    this.text = text;
    this.next = next;
    this.condition = condition;
    this.effect = effect;
  }
}

export class Condition {
  item?: string;
  gold?: number;
}

export class Effect {
  items: Item[];

  constructor(items: Item[]) {
    this.items = items;
  }

  get gold() {
    return this.items.filter(item => item.name === 'Gold').reduce((acc, item) => acc + item.count, 0);
  }
}

export class Item {
  name: string;
  description?: string;
  count: number;

  constructor(name: string, description?: string, count: number = 1) {
    this.name = name;
    this.description = description;
    this.count = count;
  }
}

export class Gold extends Item {
  constructor(count: number) {
    super('Gold', undefined, count);
  }
}

@Entity()
export class Story {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 255 })
  scene: string;

  @Column("text")
  content: string;

  @Column("simple-json")
  options: Option[];
}