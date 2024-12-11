import { loadPlacesData } from "../utils/process_dataset.js";
import { verifyToken } from "../middleware/authMiddleware.js";

export const getPlaces = [
  verifyToken,
  async (req, res) => {
    try {
      const places = await loadPlacesData();
      res.status(200).json({
        error: false,
        message: "Berhasil mengambil places",
        data: places,
      });
    } catch (error) {
      res.status(500).json({
        error: true,
        message: error.message,
      });
    }
  },
];

export const getRandomPlaces = [
  verifyToken,
  async (req, res) => {
    try {
      const { city, category } = req.query;
      const places = await loadPlacesData();
      let filteredPlaces = places;

      if (city) {
        filteredPlaces = filteredPlaces.filter(
          (place) =>
            place.city && place.city.toLowerCase() === city.toLowerCase()
        );
      }

      if (category) {
        filteredPlaces = filteredPlaces.filter(
          (place) =>
            place.category &&
            place.category.toLowerCase() === category.toLowerCase()
        );
      }

      const randomPlaces = filteredPlaces.sort(() => 0.5 - Math.random());
      res.status(200).json({
        error: false,
        message: "Berhasil mengambil places",
        data: randomPlaces,
      });
    } catch (error) {
      res.status(500).json({
        error: true,
        message: error.message,
      });
    }
  },
];
