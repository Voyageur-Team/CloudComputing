import db from "../config/db.js";
import { verifyToken } from "../middleware/authMiddleware.js";

export const checkUserPreferences = [
  verifyToken,
  async (req, res) => {
    try {
      const { tripId, userId } = req.params;

      // Validate input
      if (!tripId || !userId) {
        return res.status(400).json({
          error: true,
          message: "Trip ID and User ID are required.",
        });
      }

      // Get trip from the database
      const tripRef = db.collection("trips").doc(tripId);
      const tripDoc = await tripRef.get();

      if (!tripDoc.exists) {
        return res.status(404).json({
          error: true,
          message: "Trip not found.",
        });
      }

      const tripData = tripDoc.data();
      const participants = tripData.participants || [];

      // Find the participant
      const participant = participants.find((p) => p.userId === userId);

      if (!participant) {
        return res.status(404).json({
          error: true,
          message: "Participant not found in this trip.",
        });
      }

      // Check if preferences are filled
      const hasPreferences =
        participant.preferred_destinations &&
        participant.preferred_category &&
        participant.budget_range &&
        participant.available_dates;

      if (hasPreferences) {
        return res.status(200).json({
          error: false,
          message: "User has filled in their preferences.",
          data: participant,
        });
      } else {
        return res.status(200).json({
          error: true,
          message: "User has not filled in their preferences.",
        });
      }
    } catch (error) {
      console.error("Error checking user preferences:", error.message);
      res.status(500).json({
        error: true,
        message: error.message,
      });
    }
  },
];

// Get all participants with their preferences for a trip
export const getParticipantsWithPreferences = [
  verifyToken,
  async (req, res) => {
    try {
      const { tripId } = req.params;

      // Validate input
      if (!tripId) {
        return res.status(400).json({
          error: true,
          message: "Trip ID is required.",
        });
      }

      // Get trip from the database
      const tripRef = db.collection("trips").doc(tripId);
      const tripDoc = await tripRef.get();

      if (!tripDoc.exists) {
        return res.status(404).json({
          error: true,
          message: "Trip not found.",
        });
      }

      const tripData = tripDoc.data();
      const participants = tripData.participants || [];

      // Add tripId to each participant
      const participantsWithTripId = participants.map((participant) => ({
        ...participant,
        tripId,
      }));

      res.status(200).json({
        error: false,
        message: "Participants with preferences retrieved successfully.",
        data: participantsWithTripId,
      });
    } catch (error) {
      console.error(
        "Error retrieving participants with preferences:",
        error.message
      );
      res.status(500).json({
        error: true,
        message: error.message,
      });
    }
  },
];


// Calculate progress of participants in a trip
export const calculateParticipantProgress = [
    verifyToken,
    async (req, res) => {
      try {
        const { tripId } = req.params;
  
        // Validate input
        if (!tripId) {
          return res.status(400).json({
            error: true,
            message: "Trip ID is required.",
          });
        }
  
        // Get trip from the database
        const tripRef = db.collection("trips").doc(tripId);
        const tripDoc = await tripRef.get();
  
        if (!tripDoc.exists) {
          return res.status(404).json({
            error: true,
            message: "Trip not found.",
          });
        }
  
        const tripData = tripDoc.data();
        const participants = tripData.participants || [];
  
        // Calculate progress of participants
        const completedParticipants = participants.filter(participant =>
          participant.preferred_destinations &&
          participant.preferred_category &&
          participant.budget_range &&
          participant.available_dates
        ).length;
  
        const totalParticipants = participants.length;
  
        res.status(200).json({
          error: false,
          message: "Participant progress calculated successfully.",
          data: {
            completedParticipants,
            totalParticipants,
            participants
          }
        });
      } catch (error) {
        console.error("Error calculating participant progress:", error.message);
        res.status(500).json({
          error: true,
          message: error.message,
        });
      }
    },
  ];