import express from "express";
import { getCity, createCity, updateCity, deleteCity } from "../controllers/cityController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", verifyToken, getCity);
router.post("/create", verifyToken, createCity);
router.put("/:id/update", verifyToken, updateCity);
router.delete("/:id/delete", verifyToken, deleteCity);

export default router;
