import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Story {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 255 })
  key: string;

  @Column("text")
  content: string;

  @Column("simple-json")
  options: { text: string; next: string; condition?: any; effect?: any }[];
}