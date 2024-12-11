import express from "express";
import { getPreferences, createPreference, updatePreference, deletePreference } from "../controllers/preferencesController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", verifyToken, getPreferences);
router.post("/create", verifyToken, createPreference);
router.put("/:id/update", verifyToken, updatePreference);
router.delete("/:id/delete", verifyToken, deletePreference);

  

export default router;
