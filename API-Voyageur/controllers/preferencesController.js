import { nanoid } from "nanoid";
import db from "../config/db.js";

// Get all preferences
export const getPreferences = async (req, res) => {
  try {
    const snapshot = await db.collection("preferences").get();
    const preferences = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.status(200).json({
      error: false,
      message: "Berhasil mengambil preferences",
      data: preferences,
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};

// Create a new preference
export const createPreference = async (req, res) => {
  try {
    const { name } = req.body;

    // Validasi input
    if (!name) {
      return res.status(400).json({
        error: true,
        message: "Nama preference harus diisi.",
      });
    }

    const id = nanoid();
    await db.collection("preferences").doc(id).set({ name });

    res.status(201).json({
      error: false,
      message: "Berhasil membuat preference",
      data: { id, name },
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};

// Update a preference
export const updatePreference = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Validasi input
    if (!name) {
      return res.status(400).json({
        error: true,
        message: "Nama preference harus diisi.",
      });
    }

    const docRef = db.collection("preferences").doc(id);
    const doc = await docRef.get();

    // Cek apakah ID ditemukan
    if (!doc.exists) {
      return res.status(404).json({
        error: true,
        message: "Preference dengan ID tersebut tidak ditemukan.",
      });
    }

    await docRef.update({ name });

    res.status(200).json({
      error: false,
      message: "Berhasil mengupdate preference",
      data: { id, name },
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};

// Delete a preference
export const deletePreference = async (req, res) => {
  try {
    const { id } = req.params;

    const docRef = db.collection("preferences").doc(id);
    const doc = await docRef.get();

    // Cek apakah ID ditemukan
    if (!doc.exists) {
      return res.status(404).json({
        error: true,
        message: "Preference dengan ID tersebut tidak ditemukan.",
      });
    }

    await docRef.delete();

    res.status(200).json({
      error: false,
      message: "Berhasil menghapus preference",
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};
