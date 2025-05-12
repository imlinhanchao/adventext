import { ViewEntity, DataSource, ViewColumn } from 'typeorm';

@ViewEntity({
  name: 'rank', // 视图名称
  expression: (dataSource: DataSource) => dataSource
    .createQueryBuilder()
    .select("end.user", "user") // 用户 ID
    .addSelect("end.storyId", "storyId")
    .addSelect("COUNT(DISTINCT end.endId)", "endCount") // 通过的结局数
    .addSelect("SUM(end.cost)", "totalCost") // 总耗时
    .addSelect("user.nickname", "nickname") // 用户昵称
    .addSelect("user.username", "username") // 用户名
    .from("end", "end")
    .innerJoin("user", "user", "user.id = end.user") // 关联 user 表
    .groupBy("end.user")
    .addGroupBy("end.storyId")
    .addGroupBy("user.nickname")
    .addGroupBy("user.username"),
})
export class RankView {
  @ViewColumn()
  user: number;

  @ViewColumn()
  storyId: string;

  @ViewColumn()
  endCount: number;

  @ViewColumn()
  totalCost: number;

  @ViewColumn()
  nickname: string;

  @ViewColumn()
  username: string;
}