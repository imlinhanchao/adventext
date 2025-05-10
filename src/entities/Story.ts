import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Draft } from './Draft';

@Entity()
export class Story extends Draft {

  @Column('varchar', { length: 255, comment: '来源故事ID' })
  sourceId: string;

  constructor() {
    super()
  }
}