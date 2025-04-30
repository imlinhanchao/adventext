import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Record {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int', { comment: 'Story ID' })
  story: number;

  @Column("text", { comment: 'Story Content' })
  content: string;

  @Column('int', { comment: 'User ID' })
  user: number;

  @Column('varchar', { length: 500, comment: 'Effect Option' })
  option: string;

  @Column('bigint', { comment: 'Create Time'})
  time: number;
}