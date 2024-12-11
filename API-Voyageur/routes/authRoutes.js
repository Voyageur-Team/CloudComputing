import express from "express";
import {
  getUserProfile,
  login,
  register,
  searchUserByEmail,
} from "../controllers/authController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/user/:profileId", verifyToken, getUserProfile);
router.get("/search", verifyToken, searchUserByEmail);

export default router;
