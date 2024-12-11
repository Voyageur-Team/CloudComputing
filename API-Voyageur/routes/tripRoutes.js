import express from "express";
import {
  createTrip,
  getTripDetail,
  updateTrip,
  deleteTrip,
  voteTrip,
  getAllTripsByUser,
  getAllParticipants,
  addParticipants,
  createPreferencesParticipant,
  getRecommendation,
  deleteParticipant,
  checkUserAlreadyVote,
  finalizeVoting,
  getFinalizeVoting
} from "../controllers/tripController.js";

const router = express.Router();

router.post("/create", createTrip);
router.get("/:tripId/participants", getAllParticipants);
router.post("/:tripId/participants/add", addParticipants);
router.get("/:tripId/detail", getTripDetail);
router.put("/:tripId/update", updateTrip);
router.delete("/:tripId/delete", deleteTrip);
router.post("/:tripId/vote/:userId/:idItenerary", voteTrip);
router.get("/user/:userId", getAllTripsByUser);
router.post("/:tripId/participants/:userId/preferences", createPreferencesParticipant);
router.delete("/:tripId/participants/:userId", deleteParticipant);
router.get("/:tripId/recommendations", getRecommendation);
router.get('/:tripId/users/:userId/check-vote', checkUserAlreadyVote);
router.post('/:tripId/finalize-voting', finalizeVoting);
router.get("/:tripId/finalizevoting", getFinalizeVoting);


export default router;