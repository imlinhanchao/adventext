import { Router, Request, Response } from "express";
import { error, json } from "../utils/route";
import { ThirdParty, ThirdPartyRepo } from "../entities";

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
    const thirds = await ThirdPartyRepo.find();
    json(res, thirds);
  } catch (err: any) {
    return error(res, err.message);
  }
})

router.post('/add', async (req, res) => {
  try {
    const { name } = req.body;
    const existingThird = await ThirdPartyRepo.findOneBy({ name });
    if (existingThird) {
      return error(res, "第三方认证已存在");
    }

    const newThird = ThirdPartyRepo.create(req.body);
    const result = await ThirdPartyRepo.save(newThird);
    json(res, result);
  } catch (err: any) {
    return error(res, err.message);
  }
})

router.post('/update/:id', async (req, res) => {
  try {
    const third = await ThirdPartyRepo.findOneBy({ id: Number(req.params.id) });
    if (!third) {
      return error(res, "第三方认证不存在");
    }

    ThirdPartyRepo.merge(third, req.body);
    const result = await ThirdPartyRepo.save(third);
    json(res, result);
  } catch (err: any) {
    return error(res, err.message);
  }
})

router.delete('/delete/:id', async (req, res) => {
  try {
    const result = await ThirdPartyRepo.delete({ id: Number(req.params.id) });
    if (result.affected === 0) {
      return error(res, "第三方认证不存在");
    }
    json(res, { message: "第三方认证删除成功" });
  } catch (err: any) {
    return error(res, err.message);
  }
})

export default router;