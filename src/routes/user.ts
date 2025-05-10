import crypto from "crypto";
import { Router } from "express";
import { AppDataSource, User } from "../entities/";
import { error, json } from "../utils/route";
import utils, { omit } from "../utils";

const router = Router();

router.use((req, res, next) => {
  if (req.user?.isAdmin) {
    next();
  } else {
    error(res, "权限不足", 403);
  }
})

router.get('/list', async (req, res) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const users = await userRepository.find();
    json(res, users.map(user => omit(user, ['password'])));
  } catch (err: any) {
    return error(res, err.message);
  }
})

router.post('/update/:id', async (req, res) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    let user = await userRepository.findOneBy({ id: Number(req.params.id) });
    if (!user) {
      return error(res, "用户不存在");
    }

    userRepository.merge(user, req.body);

    if (req.body.password) {
      const sha256 = crypto.createHash('sha256');
      user.password = sha256.update(user.password + utils.config.secret.salt).digest('hex');
    }

    const result = await userRepository.save(user);
    json(res, result);
  } catch (err: any) {
    return error(res, err.message);
  }
});

router.delete('/delete/:id', async (req, res) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const result = await userRepository.delete({ id: Number(req.params.id) });
    if (result.affected === 0) {
      return error(res, "用户不存在");
    }
    json(res, { message: "用户删除成功" });
  } catch (err: any) {
    return error(res, err.message);
  }
});

export default router;