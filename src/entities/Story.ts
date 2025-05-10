import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Draft } from './Draft';

@Entity()
export class Story extends Draft {

  @Column('int', { comment: '来源故事ID' })
  sourceId: number;
  
  @Column('int', { default: 0, comment: '故事状态' })
  status: number;

  constructor() {
    super()
    this.status = 0;
  }
}