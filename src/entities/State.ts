import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class State {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int')
  userId: number;

  @Column('varchar', { length: 255 })
  currentScene: string;

  @Column('simple-json')
  inventory: Record<string, number>;

  @Column('int')
  gold: number;

  constructor(id: number = 0) {
    this.userId = id;
    this.currentScene = '';
    this.inventory = {};
    this.gold = 0;
  }
}