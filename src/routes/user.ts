import crypto from "crypto";
import { Router } from "express";
import { UserRepo } from "../entities/";
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

/**
 * @swagger
 * /api/user/list:
 *   get:
 *     summary: 获取所有用户
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 用户列表
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 */
router.get('/list', async (req, res) => {
  try {
    const users = await UserRepo.find();
    json(res, users.map(user => omit(user, ['password'])));
  } catch (err: any) {
    return error(res, err.message);
  }
})

/**
 * @swagger
 * /api/user/update/{id}:
 *   post:
 *     summary: 更新用户
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: 用户已更新
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 */
router.post('/update/:id', async (req, res) => {
  try {
    let user = await UserRepo.findOneBy({ id: Number(req.params.id) });
    if (!user) {
      return error(res, "用户不存在");
    }

    UserRepo.merge(user, req.body);

    if (req.body.password) {
      const sha256 = crypto.createHash('sha256');
      user.password = sha256.update(user.password + utils.config.secret.salt).digest('hex');
    }

    const result = await UserRepo.save(user);
    json(res, result);
  } catch (err: any) {
    return error(res, err.message);
  }
});

/**
 * @swagger
 * /api/user/delete/{id}:
 *   delete:
 *     summary: 删除用户
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 已删除
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         message:
 *                           type: string
 */
router.delete('/delete/:id', async (req, res) => {
  try {
    const result = await UserRepo.delete({ id: Number(req.params.id) });
    if (result.affected === 0) {
      return error(res, "用户不存在");
    }
    json(res, { message: "用户删除成功" });
  } catch (err: any) {
    return error(res, err.message);
  }
});

export default router;