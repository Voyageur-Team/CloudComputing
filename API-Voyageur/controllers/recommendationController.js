import { nanoid } from "nanoid";
import db from "../config/db.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { loadPlacesData, findCommonPreferences } from "../utils/process_dataset.js";

export const postMostPreferences = [
  verifyToken,
  async (req, res) => {
    try {
      const { tripId } = req.params;
      if (!tripId) {
        return res.status(400).json({
          error: true,
          message: "Trip ID is required.",
        });
      }

      const tripDoc = await db.collection("trips").doc(tripId).get();

      if (!tripDoc.exists) {
        return res.status(404).json({
          error: true,
          message: "Trip not found.",
        });
      }

      const tripData = tripDoc.data();
      const userData = tripData.participants; 
      const preferences = findCommonPreferences(userData, tripData.duration);

      await db.collection("trips").doc(tripId).update({
        most_common_destination: preferences.commonDestination,
        most_common_categories: preferences.commonCategories,
        average_budget_range: preferences.intermediateBudget,
        most_available_dates: preferences.mostCommonDates,
        trip_start_date: preferences.tripStartDate,
        trip_end_date: preferences.tripEndDate
      });

      res.status(200).json({
        error: false,
        message: "Preferences retrieved and trip updated successfully.",
        data: preferences,
      });
    } catch (error) {
      console.error("Error retrieving preferences:", error.message);
      res.status(500).json({
        error: true,
        message: error.message,
      });
    }
  },
];

// Endpoint untuk mendapatkan rekomendasi tempat berdasarkan preferensi grup
export const postTripRecommendations = [
  verifyToken,
  async (req, res) => {
    try {
      const { tripId } = req.params;
      if (!tripId) {
        return res.status(400).json({
          error: true,
          message: "Trip ID is required.",
        });
      }

      const tripDoc = await db.collection("trips").doc(tripId).get();

      if (!tripDoc.exists) {
        return res.status(404).json({
          error: true,
          message: "Trip not found.",
        });
      }

      const tripData = tripDoc.data();
      const participants = tripData.participants;

      // Periksa apakah semua peserta telah mengisi data preferensi
      const allPreferencesFilled = participants.every(participant => 
        participant.preferred_destinations && participant.preferred_category &&
        participant.budget_range && participant.available_dates
      );

      if (!allPreferencesFilled) {
        return res.status(400).json({
          error: true,
          message: "All participants must fill in preferred destinations, preferred category, budget range, and available dates.",
        });
      }

      const placesData = await loadPlacesData();

      // Filter tempat berdasarkan destination (city) dan kategori yang sesuai
      const filteredPlaces = placesData.filter(place => 
        place.city === tripData.most_common_destination &&
        tripData.most_common_categories.includes(place.category)
      );

      // Fungsi untuk membagi tempat ke dalam 3 itinerary yang berbeda, dengan minimal 5 tempat per itinerary
      const divideIntoItineraries = (places) => {
        // Acak urutan tempat
        const shuffledPlaces = places.sort(() => 0.5 - Math.random());

        // Batasi jumlah tempat minimal 5 untuk setiap itinerary
        const itinerary1 = [];
        const itinerary2 = [];
        const itinerary3 = [];

        // Masukkan tempat secara merata ke dalam ketiga itinerary (minimal 5 tempat per itinerary)
        shuffledPlaces.forEach((place, index) => {
          if (itinerary1.length < 5) {
            itinerary1.push(place);
          } else if (itinerary2.length < 5) {
            itinerary2.push(place);
          } else if (itinerary3.length < 5) {
            itinerary3.push(place);
          } else {
            // Jika semua itinerary sudah memiliki 5 tempat, tambahkan ke itinerary secara bergantian
            if (index % 3 === 0) {
              itinerary1.push(place);
            } else if (index % 3 === 1) {
              itinerary2.push(place);
            } else {
              itinerary3.push(place);
            }
          }
        });

        return [itinerary1, itinerary2, itinerary3];
      };

      // Bagi tempat yang sudah dipilih ke dalam 3 itinerary, minimal 5 tempat per itinerary
      const [itinerary1, itinerary2, itinerary3] = divideIntoItineraries(filteredPlaces);

      // Gabungkan ketiga itinerary dalam satu array dan tambahkan ID untuk setiap itinerary
      const recommendations = [
        { idItenerary: nanoid(), itinerary: itinerary1, itineraryName: "Rekomendasi 1" },
        { idItenerary: nanoid(), itinerary: itinerary2, itineraryName: "Rekomendasi 2" },
        { idItenerary: nanoid(), itinerary: itinerary3, itineraryName: "Rekomendasi 3" }
      ];

      // Periksa apakah rekomendasi untuk tripId sudah ada
      const recommendationsSnapshot = await db.collection("recommendations").where("tripId", "==", tripId).get();
      if (!recommendationsSnapshot.empty) {
        // Jika sudah ada, perbarui rekomendasi yang ada
        const recommendationDoc = recommendationsSnapshot.docs[0];
        await db.collection("recommendations").doc(recommendationDoc.id).update({
          recommendations: recommendations,
          updatedAt: new Date().toISOString()
        });

        res.status(200).json({
          error: false,
          message: "Recommendations updated successfully.",
          tripId: tripId,
          idRecommendation: recommendationDoc.id,
          data: recommendations,
        });
      } else {
        // Jika belum ada, buat rekomendasi baru
        const idRecommendation = nanoid();
        await db.collection("recommendations").doc(idRecommendation).set({
          id: idRecommendation,
          tripId: tripId,
          recommendations: recommendations,
          createdAt: new Date().toISOString()
        });

        res.status(200).json({
          error: false,
          message: "Recommendations retrieved successfully.",
          tripId: tripId,
          idRecommendation: idRecommendation,
          data: recommendations,
        });
      }
    } catch (error) {
      console.error("Error retrieving recommendations:", error.message);
      res.status(500).json({
        error: true,
        message: error.message,
      });
    }
  },
];

// Endpoint untuk mendapatkan rekomendasi berdasarkan tripId
export const getRecommendationByIdTrip = [
  verifyToken,
  async (req, res) => {
    try {
      const { tripId } = req.params;
      if (!tripId) {
        return res.status(400).json({
          error: true,
          message: "Trip ID is required.",
        });
      }

      const recommendationsSnapshot = await db.collection("recommendations").where("tripId", "==", tripId).get();
      if (recommendationsSnapshot.empty) {
        return res.status(404).json({
          error: true,
          message: "No recommendations found for this trip.",
        });
      }

      const recommendationDoc = recommendationsSnapshot.docs[0];
      const recommendationData = recommendationDoc.data();

      res.status(200).json({
        error: false,
        message: "Recommendations retrieved successfully.",
        id: recommendationData.id,
        tripId: recommendationData.tripId,
        recommendations: recommendationData.recommendations,
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


export const getRecommendationById = [
  verifyToken,
  async (req, res) => {
    try {
      const { tripId, iteneraryId } = req.params;
      if (!tripId || !iteneraryId) {
        return res.status(400).json({
          error: true,
          message: "Trip ID and Itinerary ID are required.",
        });
      }

      const recommendationsSnapshot = await db.collection("recommendations").where("tripId", "==", tripId).get();
      if (recommendationsSnapshot.empty) {
        return res.status(404).json({
          error: true,
          message: "No recommendations found for this trip.",
        });
      }

      const recommendationDoc = recommendationsSnapshot.docs[0];
      const recommendationData = recommendationDoc.data();

      const itinerary = recommendationData.recommendations.find(it => it.idItenerary === iteneraryId);
      if (!itinerary) {
        return res.status(404).json({
          error: true,
          message: "Itinerary not found.",
        });
      }

      res.status(200).json({
        error: false,
        message: "Itinerary retrieved successfully.",
        tripId: recommendationData.tripId,
        recommendations: itinerary,
      });
    } catch (error) {
      console.error("Error retrieving itinerary:", error.message);
      res.status(500).json({
        error: true,
        message: error.message,
      });
    }
  },
];

