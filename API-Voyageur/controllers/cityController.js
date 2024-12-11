import { nanoid } from 'nanoid';
import db from '../config/db.js';

// Get all cities
export const getCity = async (req, res) => {
  try {
    const snapshot = await db.collection('city').get();
    const cities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.status(200).json({
      error: false,
      message: "Berhasil mengambil city",
      data: cities
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: error.message
    });
  }
};

// Create a new city
export const createCity = async (req, res) => {
  try {
    const { name } = req.body;

    // Validasi input
    if (!name) {
      return res.status(400).json({
        error: true,
        message: "Nama city harus diisi."
      });
    }

    const id = nanoid();
    await db.collection('city').doc(id).set({ name });

    res.status(201).json({
      error: false,
      message: "Berhasil membuat city",
      data: { id, name }
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: error.message
    });
  }
};

// Update a city
export const updateCity = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Validasi input
    if (!name) {
      return res.status(400).json({
        error: true,
        message: "Nama city harus diisi."
      });
    }

    const docRef = db.collection('city').doc(id);
    const doc = await docRef.get();

    // Cek apakah ID ditemukan
    if (!doc.exists) {
      return res.status(404).json({
        error: true,
        message: "City dengan ID tersebut tidak ditemukan."
      });
    }

    await docRef.update({ name });

    res.status(200).json({
      error: false,
      message: "Berhasil mengupdate city",
      data: { id, name }
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: error.message
    });
  }
};

// Delete a city
export const deleteCity = async (req, res) => {
  try {
    const { id } = req.params;

    const docRef = db.collection('city').doc(id);
    const doc = await docRef.get();

    // Cek apakah ID ditemukan
    if (!doc.exists) {
      return res.status(404).json({
        error: true,
        message: "City dengan ID tersebut tidak ditemukan."
      });
    }

    await docRef.delete();

    res.status(200).json({
      error: false,
      message: "Berhasil menghapus city"
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: error.message
    });
  }
};
