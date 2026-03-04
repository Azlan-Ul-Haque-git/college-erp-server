import jwt from "jsonwebtoken";
export const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
export const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
