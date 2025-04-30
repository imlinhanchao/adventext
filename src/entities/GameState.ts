import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class GameState {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  state: string;

  @Column('varchar', { length: 255 })
  currentScene: string;

  @Column('simple-json')
  inventory: Record<string, boolean>;

  @Column('int')
  gold: number;
}