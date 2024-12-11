import express from 'express';
import { checkUserPreferences, getParticipantsWithPreferences, calculateParticipantProgress } from '../controllers/userController.js';

const router = express.Router();

router.get('/:tripId/check-preferences/:userId', checkUserPreferences);
router.get('/:tripId/participants-with-preferences', getParticipantsWithPreferences);
router.get('/:tripId/participant-progress', calculateParticipantProgress);

export default router;