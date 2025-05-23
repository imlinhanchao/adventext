import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class ThirdParty {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: "名称" })
  name: string;

  @Column({ comment: "前缀" })
  prefix: string = '';

  @Column({ comment: "icon" })
  icon: string;

  @Column('varchar', { length: 1024, comment: "认证地址" })
  authUrl: string;

  @Column("json", { comment: "认证参数" })
  authParams: Record<string, string>;

  @Column('varchar', { length: 1024, comment: "校验地址" })
  verifyUrl: string;

  @Column({ comment: "校验地址请求方式" })
  verifyMethod: string;

  @Column("json", { comment: "校验参数" })
  verifyParams: Record<string, string>;

  @Column('varchar', { length: 512, comment: "校验返回值" })
  verifyFormula: string;

  @Column('varchar', { length: 1024, comment: "用户信息地址" })
  userUrl: string;

  @Column({ comment: "用户信息地址请求方式" })
  userMethod: string;

  @Column("json", { comment: "用户信息参数" })
  userParams: Record<string, string>;

  @Column("json", { comment: "用户信息返回值" })
  userKey: {
    username: string;
    nickname: string;
  };
}