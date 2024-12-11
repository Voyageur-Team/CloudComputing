import fetch from "node-fetch";
import * as tf from "@tensorflow/tfjs-node";
import Papa from "papaparse";

async function loadPlacesData() {
  const filePath =
    "https://storage.googleapis.com/dataset-voyageur/places_data_merged.csv";

  return new Promise((resolve, reject) => {
    fetch(filePath)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      })
      .then((text) => {
        Papa.parse(text, {
          header: false,
          skipEmptyLines: true,
          dynamicTyping: true,
          complete: (results) => {
            const filteredData = results.data
              .map((row) => {
                if (row.length >= 8) {
                  return {
                    id: row[0],
                    name: row[1],
                    description: row[2],
                    category: row[3],
                    city: row[4],
                    price: row[5],
                    rating: row[6],
                    location: row[7],
                  };
                }
                return null;
              })
              .filter((row) => row !== null);

            resolve(filteredData);
          },
          error: (error) => {
            reject(new Error("Error parsing CSV: " + error.message));
          },
        });
      })
      .catch((error) => {
        reject(new Error("Error loading CSV: " + error.message));
      });
  });
}

// Fungsi untuk memuat model dari file JSON
async function loadModel() {
  const modelPath =
    "https://storage.googleapis.com/dataset-voyageur/model.json";
  try {
    const model = await tf.loadLayersModel(modelPath);
    return model;
  } catch (err) {
    console.error("Error loading model:", err);
    throw err;
  }
}

// Fungsi untuk mendapatkan rekomendasi tempat
async function getRecommendationPlace(
  model,
  queryCity,
  queryCategory,
  queryPriceCategory,
  kNum
) {
  const inputs = {
    City: tf.tensor([queryCity]),
    Category: tf.tensor([queryCategory]),
    Price_Category: tf.tensor([queryPriceCategory]),
  };

  const results = model.predict(inputs);
  const place = results.arraySync()[0];

  const recommendedPlaces = place.map((p) => p.toString());
  return recommendedPlaces.slice(0, kNum);
}

// Fungsi untuk merekomendasikan tempat untuk grup
async function recommendPlacesForGroup(groupData, model, kNum = 20) {
  const recommendations = [];
  const budgetThreshold = groupData.average_budget_range;
  const seenPlaces = new Set();

  for (const category of groupData.most_common_categories) {
    let priceCategory;
    if (budgetThreshold < 75000) {
      priceCategory = "0-25";
    } else if (75000 <= budgetThreshold < 150000) {
      priceCategory = "25-50";
    } else if (150000 <= budgetThreshold < 300000) {
      priceCategory = "50-100";
    } else if (300000 <= budgetThreshold < 600000) {
      priceCategory = "100-200";
    } else {
      priceCategory = "200+";
    }

    const recommendedPlaces = await getRecommendationPlace(
      model,
      groupData.most_common_destination,
      category,
      priceCategory,
      kNum
    );

    for (const place of recommendedPlaces) {
      if (!seenPlaces.has(place)) {
        recommendations.push(place);
        seenPlaces.add(place);
      }
    }
  }
  return recommendations;
}

// Fungsi untuk membangun itinerary
function buildItinerary(
  recommendedPlaces,
  numItineraries = 3,
  placesPerItinerary = 4
) {
  if (recommendedPlaces.length < numItineraries * placesPerItinerary) {
    throw new Error("Not enough recommended places to create itineraries.");
  }

  const shuffledPlaces = recommendedPlaces.sort(() => 0.5 - Math.random());
  const itineraries = [];

  for (let i = 0; i < numItineraries; i++) {
    const startIndex = i * placesPerItinerary;
    const endIndex = Math.min(
      (i + 1) * placesPerItinerary,
      shuffledPlaces.length
    );
    const itinerary = shuffledPlaces.slice(startIndex, endIndex);
    itineraries.push(itinerary);
  }

  return itineraries;
}

// Fungsi untuk membangun pilihan itinerary
function buildItineraryChoice(places, daysOfTrip) {
  const itineraryChoiceList = [];
  for (let i = 0; i < 3; i++) {
    const itineraries = buildItinerary(places, daysOfTrip);
    itineraryChoiceList.push({
      id: `CH${i + 1}`,
      itinerary: itineraries,
    });
  }

  return {
    itinerary_choices: itineraryChoiceList,
  };
}

// Fungsi untuk menemukan preferensi umum
function findCommonPreferences(userData, daysOfTrip) {
  // Pastikan userData adalah array
  if (!Array.isArray(userData)) {
    throw new Error("userData harus berupa array");
  }

  // Find the most common destination
  const allDestinations = userData.reduce(
    (acc, user) => acc.concat(user.preferred_destinations),
    []
  );
  const commonDestination = allDestinations
    .sort(
      (a, b) =>
        allDestinations.filter((v) => v === a).length -
        allDestinations.filter((v) => v === b).length
    )
    .pop();

  // Find the top 3 most common categories
  const allCategories = userData.reduce(
    (acc, user) => acc.concat(user.preferred_category),
    []
  );
  const categoryCounts = allCategories.reduce((acc, category) => {
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});
  const commonCategories = Object.keys(categoryCounts)
    .sort((a, b) => categoryCounts[b] - categoryCounts[a])
    .slice(0, 3);

  // Calculate the average budget range
  const minBudgets = userData.map((user) => user.budget_range[0]);
  const maxBudgets = userData.map((user) => user.budget_range[1]);
  const intermediateBudget =
    (minBudgets.reduce((a, b) => a + b, 0) / minBudgets.length +
      maxBudgets.reduce((a, b) => a + b, 0) / maxBudgets.length) /
    2;

  // Find most available date
  const allDates = userData.reduce(
    (acc, user) => acc.concat(user.available_dates),
    []
  );
  const dateCounts = allDates.reduce((acc, date) => {
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});
  const mostCommonDates = Object.keys(dateCounts).filter(
    (date) => dateCounts[date] === Math.max(...Object.values(dateCounts))
  );

  const sortedDates = mostCommonDates.sort();
  const tripStartDate = sortedDates[0];
  const tripEndDate = new Date(
    new Date(tripStartDate).getTime() + (daysOfTrip - 1) * 24 * 60 * 60 * 1000
  )
    .toISOString()
    .split("T")[0];

  return {
    commonDestination,
    commonCategories,
    intermediateBudget,
    mostCommonDates,
    tripStartDate,
    tripEndDate,
  };
}

export {
  loadPlacesData,
  loadModel,
  getRecommendationPlace,
  recommendPlacesForGroup,
  buildItinerary,
  buildItineraryChoice,
  findCommonPreferences,
};
