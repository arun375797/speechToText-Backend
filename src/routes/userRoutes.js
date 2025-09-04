import { Router } from "express";
import authRequired from "../middlewares/authRequired.js";
import { me, listUsers } from "../controllers/userController.js";

const router = Router();

router.get("/me", authRequired, me);
router.get("/users", authRequired, listUsers);

export default router;
