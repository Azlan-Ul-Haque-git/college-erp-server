import jwt from "jsonwebtoken";

export const generateToken = (id) => {
    return jwt.sign(
        { id },
        process.env.JWT_SECRET || "secret123",
        {
            expiresIn: "7d",
        }
    );
};

export const generateOTP = () => {
    return Math.floor(
        100000 + Math.random() * 900000
    ).toString();
};