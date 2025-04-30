import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class State {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  state: string;

  @Column('varchar', { length: 255 })
  currentScene: string;

  @Column('simple-json')
  inventory: Record<string, number>;

  @Column('int')
  gold: number;

  constructor() {
    this.state = '';
    this.currentScene = '';
    this.inventory = {};
    this.gold = 0;
  }
}