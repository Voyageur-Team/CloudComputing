import express from "express";
import {
    getPlaces,
    getRandomPlaces
} from "../controllers/placesController.js";

const router = express.Router();

router.get("/", getPlaces);
router.get('/random', getRandomPlaces);

export default router;