// services/identity-svc/src/routes/userRoutes.js
import express from "express";
import * as UserController from "../controllers/UserController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Định nghĩa route: GET / và PUT /
// Khi mount ở index.js là '/users', đường dẫn đầy đủ sẽ là /users/profile
router.get("/profile", verifyToken, UserController.getProfile);
router.put("/profile", verifyToken, UserController.updateProfile);

export default router;
