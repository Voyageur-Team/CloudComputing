import dotenv from "dotenv";
import express from "express";
import tripRoutes from "./routes/tripRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import preferencesRoutes from "./routes/preferencesRoutes.js";
import cityRoutes from "./routes/cityRoutes.js";
import placesRoutes from "./routes/placesRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

const app = express();
app.use(express.json());

app.use("/trips", tripRoutes); 
app.use("/auth", authRoutes); 
app.use("/preferences", preferencesRoutes);
app.use("/city", cityRoutes);
app.use("/places", placesRoutes);
app.use("/recommendations", recommendationRoutes);
app.use("/user", userRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
