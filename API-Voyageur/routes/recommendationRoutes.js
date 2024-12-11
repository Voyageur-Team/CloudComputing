import express from 'express';
import { postMostPreferences, postTripRecommendations, getRecommendationByIdTrip, getRecommendationById } from '../controllers/recommendationController.js';

const router = express.Router();

router.post('/preferences/:tripId', postMostPreferences);
router.post('/trip/:tripId/recommendations', postTripRecommendations);
router.get('/:tripId', getRecommendationByIdTrip);
router.get('/:tripId/:iteneraryId', getRecommendationById);

export default router;