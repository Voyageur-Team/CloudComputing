import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(403).json({
      error: true,
      message: "Token is required.",
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        error: true,
        message: "Invalid or expired token.",
      });
    }

    req.userId = decoded.userId;
    req.userName = decoded.userName;
    req.userEmail = decoded.userEmail;
    next();
  });
};
