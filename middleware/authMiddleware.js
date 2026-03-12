import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";

// Protect routes (JWT authentication)
export const protect = asyncHandler(async (req, res, next) => {

  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, token missing");
  }

  try {

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      res.status(401);
      throw new Error("User not found");
    }

    if (!req.user.isActive) {
      res.status(401);
      throw new Error("User account is deactivated");
    }

    next();

  } catch (error) {
    res.status(401);
    throw new Error("Token invalid or expired");
  }

});


// Role Based Access Control (RBAC)
export const authorizeRoles = (...roles) => {

  return (req, res, next) => {

    if (!req.user) {
      res.status(401);
      throw new Error("User not authenticated");
    }

    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`Role '${req.user.role}' is not allowed to access this resource`);
    }

    next();
  };

};