import { nanoid } from "nanoid";
import db from "../config/db.js";
import { verifyToken } from "../middleware/authMiddleware.js";

// Create a new trip
export const createTrip = [
  verifyToken,
  async (req, res) => {
    try {
      const { title, duration, description } = req.body;

      // Validate input body
      if (!title || !duration || !description) {
        return res.status(400).json({
          error: true,
          message: "Title, duration, and description are required.",
        });
      }

      const tripId = nanoid();
      const { userId, userName, userEmail } = req;

      if (!userId || !userName || !userEmail) {
        return res.status(400).json({
          error: true,
          message: "User data is missing or invalid.",
        });
      }

      // Prepare trip data
      const tripData = {
        id: tripId,
        title,
        duration,
        description,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        votes: 0,
        participants: [
          {
            userId,
            userName,
            email: userEmail,
          },
        ],
      };

      // Save the trip data to the database
      await db.collection("trips").doc(tripId).set(tripData);

      res.status(201).json({
        error: false,
        message: "Trip created successfully.",
        data: tripData,
      });
    } catch (error) {
      console.error("Error creating trip:", error.message);
      res.status(500).json({
        error: true,
        message: error.message,
      });
    }
  },
];

// Get all participants in a trip
export const getAllParticipants = [
  verifyToken,
  async (req, res) => {
    try {
      const { tripId } = req.params;

      // Validasi tripId
      if (!tripId) {
        return res.status(400).json({
          error: true,
          message: "Trip ID is required.",
        });
      }

      // Ambil trip dari database
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

      res.status(200).json({
        error: false,
        message: "Participants retrieved successfully.",
        data: participants,
      });
    } catch (error) {
      console.error("Error retrieving participants:", error.message);
      res.status(500).json({
        error: true,
        message: error.message,
      });
    }
  },
];

// Add participants to a trip
export const addParticipants = [
  verifyToken,
  async (req, res) => {
    try {
      const { tripId } = req.params;
      const { userId, userName, email } = req.body; // Accept email as part of the request body

      // Validasi input
      if (!userId || !userName || !email) {
        return res.status(400).json({
          error: true,
          message: "userId, userName, and email are required.",
        });
      }

      // Ambil trip dari database
      const tripRef = db.collection("trips").doc(tripId);
      const tripDoc = await tripRef.get();

      if (!tripDoc.exists) {
        return res.status(404).json({
          error: true,
          message: "Trip not found.",
        });
      }

      const tripData = tripDoc.data();
      const existingParticipants = tripData.participants || [];

      // Periksa apakah user sudah menjadi peserta
      if (
        existingParticipants.some(
          (participant) => participant.userId === userId
        )
      ) {
        return res.status(400).json({
          error: true,
          message: "User is already a participant in this trip.",
        });
      }

      // Tambahkan peserta baru ke dalam trip
      const updatedParticipants = [
        ...existingParticipants,
        { userId, userName, email }, // Tambahkan email ke data peserta
      ];

      await tripRef.update({ participants: updatedParticipants });

      res.status(200).json({
        error: false,
        message: "Participant added successfully.",
        data: updatedParticipants,
      });
    } catch (error) {
      console.error("Error adding participant:", error.message);
      res.status(500).json({
        error: true,
        message: error.message,
      });
    }
  },
];

// Delete participant from a trip
export const deleteParticipant = [
  verifyToken,
  async (req, res) => {
    try {
      const { tripId, userId } = req.params;

      // Validasi input
      if (!tripId || !userId) {
        return res.status(400).json({
          error: true,
          message: "Trip ID and User ID are required.",
        });
      }

      // Ambil trip dari database
      const tripRef = db.collection("trips").doc(tripId);
      const tripDoc = await tripRef.get();

      if (!tripDoc.exists) {
        return res.status(404).json({
          error: true,
          message: "Trip not found.",
        });
      }

      const tripData = tripDoc.data();
      const existingParticipants = tripData.participants || [];

      // Periksa apakah user adalah peserta
      const participantIndex = existingParticipants.findIndex(
        (participant) => participant.userId === userId
      );
      if (participantIndex === -1) {
        return res.status(404).json({
          error: true,
          message: "Participant not found in this trip.",
        });
      }

      // Ambil nama peserta sebelum menghapusnya
      const participantName = existingParticipants[participantIndex].userName;

      // Hapus peserta dari trip
      existingParticipants.splice(participantIndex, 1);

      await tripRef.update({ participants: existingParticipants });

      res.status(200).json({
        error: false,
        message: `Participant ${participantName} removed successfully.`,
      });
    } catch (error) {
      console.error("Error removing participant:", error.message);
      res.status(500).json({
        error: true,
        message: error.message,
      });
    }
  },
];

// Get trip details
export const getTripDetail = [
  verifyToken,
  async (req, res) => {
    try {
      const { tripId } = req.params;
      const tripDoc = await db.collection("trips").doc(tripId).get();

      if (!tripDoc.exists) {
        return res.status(404).json({
          error: true,
          message: "Trip not found.",
        });
      }

      res.status(200).json({
        error: false,
        message: "Trip details retrieved successfully.",
        data: tripDoc.data(),
      });
    } catch (error) {
      console.error("Error retrieving trip details:", error.message);
      res.status(500).json({
        error: true,
        message: error.message,
      });
    }
  },
];

// Create or update preferences for a participant in a trip
export const createPreferencesParticipant = [
  verifyToken, // Middleware to verify token
  async (req, res) => {
    try {
      const { tripId, userId } = req.params; // tripId dan userId diambil dari params
      const {
        preferred_destinations,
        preferred_category,
        budget_range,
        available_dates,
      } = req.body;

      // Validasi input
      if (
        !preferred_destinations ||
        !preferred_category ||
        !budget_range ||
        !available_dates
      ) {
        return res.status(400).json({
          error: true,
          message:
            "preferred_destinations, preferred_category, budget_range, and available_dates are required.",
        });
      }

      // Ambil trip dari database
      const tripRef = db.collection("trips").doc(tripId);
      const tripDoc = await tripRef.get();

      // Jika trip tidak ditemukan
      if (!tripDoc.exists) {
        return res.status(404).json({
          error: true,
          message: "Trip not found.",
        });
      }

      const tripData = tripDoc.data();
      const participants = tripData.participants || [];

      // Cari peserta dalam daftar participants menggunakan userId
      const participantIndex = participants.findIndex(
        (p) => p.userId === userId
      );

      // Jika peserta tidak ditemukan dalam trip
      if (participantIndex === -1) {
        return res.status(404).json({
          error: true,
          message: "Participant not found in this trip.",
        });
      }

      // Update preferensi peserta
      participants[participantIndex] = {
        ...participants[participantIndex], // Pertahankan data peserta yang sudah ada
        preferred_destinations,
        preferred_category,
        budget_range,
        available_dates,
      };

      // Update trip dengan daftar peserta yang sudah dimodifikasi
      await tripRef.update({ participants });

      res.status(200).json({
        error: false,
        message: "Preferences updated successfully.",
        data: participants[participantIndex], // Mengirimkan data peserta yang sudah terupdate
      });
    } catch (error) {
      console.error("Error updating participant preferences:", error.message);
      res.status(500).json({
        error: true,
        message: error.message,
      });
    }
  },
];

// Fungsi untuk mendapatkan rekomendasi berdasarkan preferensi peserta
export const getRecommendation = [
  verifyToken,
  async (req, res) => {
    try {
      const { tripId } = req.params;
      const tripDoc = await db.collection("trips").doc(tripId).get();

      if (!tripDoc.exists) {
        return res.status(404).json({
          error: true,
          message: "Trip not found.",
        });
      }

      const tripData = tripDoc.data();
      const participants = tripData.participants || [];

      // Check if there are enough participants
      if (participants.length < 2) {
        return res.status(400).json({
          error: true,
          message: "At least 2 participants are required for recommendations.",
        });
      }

      // Generate recommendations
      const recommendations = await generateRecommendations(participants);

      res.status(200).json({
        error: false,
        message: "Recommendations retrieved successfully.",
        data: recommendations,
      });
    } catch (error) {
      console.error("Error retrieving recommendations:", error.message);
      res.status(500).json({
        error: true,
        message: error.message,
      });
    }
  },
];

// Update a trip
export const updateTrip = [
  verifyToken,
  async (req, res) => {
    try {
      const { tripId } = req.params;
      const updatedData = req.body;

      // Validate input
      if (!updatedData || Object.keys(updatedData).length === 0) {
        return res.status(400).json({
          error: true,
          message: "No data provided for update.",
        });
      }

      const tripRef = db.collection("trips").doc(tripId);
      const tripDoc = await tripRef.get();

      if (!tripDoc.exists) {
        return res.status(404).json({
          error: true,
          message: "Trip not found.",
        });
      }

      // Allow only the creator to update the trip
      if (tripDoc.data().createdBy !== req.userId) {
        return res.status(403).json({
          error: true,
          message: "You are not authorized to update this trip.",
        });
      }

      await tripRef.update({
        ...updatedData,
        updatedAt: new Date().toISOString(),
      });

      res.status(200).json({
        error: false,
        message: "Trip updated successfully.",
        data: { id: tripId, ...updatedData },
      });
    } catch (error) {
      console.error("Error updating trip:", error.message);
      res.status(500).json({
        error: true,
        message: error.message,
      });
    }
  },
];

// Get all trips by user
export const getAllTripsByUser = [
  verifyToken,
  async (req, res) => {
    try {
      const { userId } = req.params;

      // Validasi input
      if (!userId) {
        return res.status(400).json({
          error: true,
          message: "User ID is required.",
        });
      }

      const tripsSnapshot = await db.collection("trips").get();

      if (tripsSnapshot.empty) {
        return res.status(404).json({
          error: true,
          message: "No trips found.",
        });
      }

      const trips = tripsSnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter(
          (trip) =>
            trip.createdBy === userId ||
            (trip.participants &&
              trip.participants.some((p) => p.userId === userId))
        );

      if (trips.length === 0) {
        return res.status(404).json({
          error: true,
          message: "Belum ada rencana trip",
        });
      }

      res.status(200).json({
        error: false,
        message: "Trips retrieved successfully.",
        data: trips,
      });
    } catch (error) {
      console.error("Error retrieving trips for user:", error.message);
      res.status(500).json({
        error: true,
        message: error.message,
      });
    }
  },
];

// Delete a trip
export const deleteTrip = [
  verifyToken,
  async (req, res) => {
    try {
      const { tripId } = req.params;

      const tripRef = db.collection("trips").doc(tripId);
      const tripDoc = await tripRef.get();

      if (!tripDoc.exists) {
        return res.status(404).json({
          error: true,
          message: "Trip not found.",
        });
      }

      // Allow only the creator to delete the trip
      if (tripDoc.data().createdBy !== req.userId) {
        return res.status(403).json({
          error: true,
          message: "You are not authorized to delete this trip.",
        });
      }

      await tripRef.delete();

      res.status(200).json({
        error: false,
        message: "Trip deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting trip:", error.message);
      res.status(500).json({
        error: true,
        message: error.message,
      });
    }
  },
];

// Vote for a trip
export const voteTrip = [
  verifyToken,
  async (req, res) => {
    try {
      const { tripId, userId, idItenerary } = req.params;

      // Validasi input
      if (!tripId || !userId || !idItenerary) {
        return res.status(400).json({
          error: true,
          message: "Trip ID, User ID, and Itinerary ID are required.",
        });
      }

      // Ambil trip dari database
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

      // Periksa apakah user adalah peserta
      const isParticipant = participants.some(
        (participant) => participant.userId === userId
      );
      if (!isParticipant) {
        return res.status(403).json({
          error: true,
          message: "You are not authorized to vote for this trip.",
        });
      }

      // Ambil rekomendasi dari database
      const recommendationsSnapshot = await db
        .collection("recommendations")
        .where("tripId", "==", tripId)
        .get();
      if (recommendationsSnapshot.empty) {
        return res.status(404).json({
          error: true,
          message: "No recommendations found for this trip.",
        });
      }

      const recommendationDoc = recommendationsSnapshot.docs[0];
      const recommendationData = recommendationDoc.data();

      // Periksa apakah user sudah memberikan suara pada itinerary manapun dalam trip ini
      const hasVoted = recommendationData.recommendations.some(
        (it) => it.votes && it.votes.includes(userId)
      );
      if (hasVoted) {
        return res.status(400).json({
          error: true,
          message: "You have already voted for an itinerary in this trip.",
        });
      }

      // Cari itinerary yang dipilih
      const itinerary = recommendationData.recommendations.find(
        (it) => it.idItenerary === idItenerary
      );
      if (!itinerary) {
        return res.status(404).json({
          error: true,
          message: "Itinerary not found.",
        });
      }

      // Tambahkan userId ke dalam array votes dalam itinerary yang dipilih
      itinerary.votes = itinerary.votes
        ? [...itinerary.votes, userId]
        : [userId];

      // Perbarui rekomendasi dalam database
      await db.collection("recommendations").doc(recommendationDoc.id).update({
        recommendations: recommendationData.recommendations,
        updatedAt: new Date().toISOString(),
      });

      res.status(200).json({
        error: false,
        message: "Voting berhasil dilakukan.",
        tripId: tripId,
        idItenerary: idItenerary,
        votes: itinerary.votes.length,
      });
    } catch (error) {
      console.error("Error voting for itinerary:", error.message);
      res.status(500).json({
        error: true,
        message: error.message,
      });
    }
  },
];


// Check if user has already voted for any itinerary in the trip
export const checkUserAlreadyVote = [
  verifyToken,
  async (req, res) => {
    try {
      const { tripId, userId } = req.params;

      // Validasi input
      if (!tripId || !userId) {
        return res.status(400).json({
          error: true,
          message: "Trip ID and User ID are required.",
        });
      }

      // Ambil rekomendasi dari database
      const recommendationsSnapshot = await db
        .collection("recommendations")
        .where("tripId", "==", tripId)
        .get();
      if (recommendationsSnapshot.empty) {
        return res.status(404).json({
          error: true,
          message: "No recommendations found for this trip.",
        });
      }

      const recommendationDoc = recommendationsSnapshot.docs[0];
      const recommendationData = recommendationDoc.data();

      // Periksa apakah user sudah memberikan suara pada itinerary manapun dalam trip ini
      const votedItinerary = recommendationData.recommendations.find(
        (it) => it.votes && it.votes.includes(userId)
      );
      if (votedItinerary) {
        return res.status(200).json({
          error: false,
          message: "User has already voted for an itinerary in this trip.",
          data: {
            userId: userId,
            tripId: tripId,
            idItenerary: votedItinerary.idItenerary,
          },
        });
      }

      res.status(200).json({
        error: true,
        message: "User has not voted for any itinerary in this trip.",
        userId: userId,
      });
    } catch (error) {
      console.error("Error checking user vote status:", error.message);
      res.status(500).json({
        error: true,
        message: error.message,
      });
    }
  },
];


export const finalizeVoting = [
  verifyToken,
  async (req, res) => {
    try {
      const { tripId } = req.params;

      // Fetch trip data
      const tripRef = db.collection("trips").doc(tripId);
      const tripDoc = await tripRef.get();

      if (!tripDoc.exists) {
        return res.status(404).json({
          error: true,
          message: "Trip not found.",
        });
      }

      const tripData = tripDoc.data();
      const duration = tripData.duration;

      // Fetch recommendations for the trip
      const recommendationRef = db.collection("recommendations").where("tripId", "==", tripId);
      const recommendationSnapshot = await recommendationRef.get();

      if (recommendationSnapshot.empty) {
        return res.status(404).json({
          error: true,
          message: "Recommendations not found.",
        });
      }

      let selectedItinerary = null;
      let maxVotes = 0;

      // Find the itinerary with the most votes
      recommendationSnapshot.forEach(doc => {
        const recommendationData = doc.data();
        recommendationData.recommendations.forEach(itinerary => {
          const voteCount = itinerary.votes ? itinerary.votes.length : 0;
          if (voteCount > maxVotes) {
            maxVotes = voteCount;
            selectedItinerary = itinerary;
          }
        });
      });

      if (!selectedItinerary || !Array.isArray(selectedItinerary.itinerary)) {
        return res.status(404).json({
          error: true,
          message: "No valid itinerary found with votes.",
        });
      }

      // Divide the itinerary items into multiple days based on the duration
      const dividedItinerary = [];
      const itemsPerDay = Math.ceil(selectedItinerary.itinerary.length / duration);

      for (let i = 0; i < duration; i++) {
        const dayItems = selectedItinerary.itinerary.slice(
          i * itemsPerDay,
          (i + 1) * itemsPerDay
        );
        dividedItinerary.push({
          day: i + 1,
          items: dayItems,
        });
      }

      // Update the selected itinerary with the divided itinerary
      selectedItinerary.dividedItinerary = dividedItinerary;

      // Remove all other itineraries from the recommendations
      recommendationSnapshot.forEach(async doc => {
        const recommendationData = doc.data();
        recommendationData.recommendations = recommendationData.recommendations.filter(
          (it) => it.idItenerary === selectedItinerary.idItenerary
        );

        // Update the recommendations in the database
        await db.collection("recommendations").doc(doc.id).update({
          recommendations: recommendationData.recommendations,
          updatedAt: new Date().toISOString(),
        });
      });

      // Save the finalized itinerary to the trip document
      await tripRef.update({
        finalizedItinerary: selectedItinerary.dividedItinerary,
        updatedAt: new Date().toISOString(),
      });

      res.status(200).json({
        error: false,
        message: "Voting finalized successfully.",
        data: selectedItinerary,
      });
    } catch (error) {
      console.error("Error finalizing voting:", error.message);
      res.status(500).json({
        error: true,
        message: error.message,
      });
    }
  },
];


// Get Finalize Voting
export const getFinalizeVoting = [
  verifyToken,
  async (req, res) => {
    try {
      const { tripId } = req.params;

      // Fetch trip data
      const tripRef = db.collection("trips").doc(tripId);
      const tripDoc = await tripRef.get();

      if (!tripDoc.exists) {
        return res.status(404).json({
          error: true,
          message: "Trip not found.",
        });
      }

      const tripData = tripDoc.data();

      if (!tripData.finalizedItinerary) {
        return res.status(404).json({
          error: true,
          message: "No finalized itinerary found.",
        });
      }

      res.status(200).json({
        error: false,
        message: "Finalized itinerary retrieved successfully.",
        data: tripData.finalizedItinerary,
      });
    } catch (error) {
      console.error("Error retrieving finalized voting:", error.message);
      res.status(500).json({
        error: true,
        message: error.message,
      });
    }
  },
];