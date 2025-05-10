import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Draft } from './Draft';

@Entity()
export class Story extends Draft {

  @Column('int', { comment: '来源故事ID' })
  sourceId: number;

  constructor() {
    super()
  }
}