import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class End {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int', { comment: '结局 ID，绑定 Profile 和 Record' })
  endId: number;

  @Column('int', { comment: '用户 ID' })
  user: number;

  @Column('varchar', { length: 255, comment: '故事 ID' })
  storyId: string;

  @Column('varchar', { length: 255, comment: '结局' })
  end: string;

  @Column('varchar', { length: 255, comment: '来源场景' })
  from: string;

  @Column('bigint', { comment: '触发时间'})
  time: number;

  @Column('bigint', { comment: '耗费时间'})
  cost: number;
}