import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Record {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 255, comment: '场景' })
  story: string;

  @Column('varchar', { length: 255, comment: '来源场景' })
  from: string;

  @Column("text", { comment: '内容' })
  content: string;

  @Column('int', { comment: '用户 ID' })
  user: number;

  @Column('varchar', { length: 500, comment: '选项' })
  option: string;

  @Column('bigint', { comment: '选择时间'})
  time: number;
}