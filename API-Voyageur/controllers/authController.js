import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import db from "../config/db.js";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// Fungsi untuk menangani pendaftaran pengguna
export const register = async (req, res) => {
  try {
    const { email, password, userName } = req.body;

    // Validate input fields
    if (!email || !password || !userName) {
      return res.status(400).json({
        error: true,
        message: "Email, password, dan userName wajib diisi.",
      });
    }

    // Validate email format
    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isValidEmail(email)) {
      return res.status(400).json({
        error: true,
        message: "Invalid email format.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const profileId = nanoid(10);

    const userCollection = db.collection("users");
    const emailSnapshot = await userCollection.where("email", "==", email).get();

    // Check if the email is already registered
    if (!emailSnapshot.empty) {
      return res.status(400).json({
        error: true,
        message: "Email sudah digunakan.",
      });
    }

    // Save the user to the database
    await userCollection.doc(profileId).set({
      profileId,
      email,
      password: hashedPassword,
      userName,
    });

    res.status(201).json({
      error: false,
      message: "User created successfully.",
    });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
};

// Fungsi untuk menangani login pengguna
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input fields
    if (!email || !password) {
      return res.status(400).json({
        error: true,
        message: "Email dan password wajib diisi.",
      });
    }

    // Retrieve user from the database based on email
    const userRef = db.collection("users");
    const snapshot = await userRef.where("email", "==", email).get();

    if (snapshot.empty) {
      return res.status(404).json({
        error: true,
        message: "Email atau password salah.",
      });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, userData.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: true,
        message: "Password salah.",
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: userData.profileId, userEmail: userData.email, userName: userData.userName },
      JWT_SECRET
    );

    res.status(200).json({
      error: false,
      message: "Login berhasil.",
      loginResult: {
        userId: userData.profileId,
        email: userData.email,
        userName: userData.userName,
        token: token,
      },
    });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
};

// Fungsi untuk mendapatkan profil pengguna
export const getUserProfile = async (req, res) => {
  try {
    const { profileId } = req.params;

    const userRef = db.collection("users").doc(profileId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({
        error: true,
        message: "User not found.",
      });
    }

    res.status(200).json({
      error: false,
      message: "User found.",
      user: userDoc.data(),
    });
  } catch (error) {
    console.error("Error in getUserProfile:", error);
    res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};

// Fungsi untuk mencari user berdasarkan email
export const searchUserByEmail = async (req, res) => {
  try {
    const { email } = req.query;

    // Validate email input
    if (!email) {
      return res.status(400).json({
        error: true,
        message: "Email is required for search.",
      });
    }

    // Normalize email to lowercase for flexible matching
    const normalizedEmail = email.toLowerCase();

    // Query the database for users with the matching email
    const userRef = db.collection("users");
    const snapshot = await userRef.where("email", "==", normalizedEmail).get();

    if (snapshot.empty) {
      return res.status(404).json({
        error: true,
        message: "User with this email not found.",
      });
    }

    // Return matching users
    const matchedUsers = snapshot.docs.map((doc) => doc.data()).map((user) => ({
      userId: user.profileId,
      email: user.email,
      userName: user.userName,
    }));

    res.status(200).json({
      error: false,
      message: "Users found.",
      users: matchedUsers,
    });
  } catch (error) {
    console.error("Error searching user by email:", error);
    res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};
