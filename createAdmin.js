import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {

        const existing = await User.findOne({
            email: "admin@gmail.com"
        });

        if (existing) {
            console.log("Admin already exists");
            process.exit();
        }

        const admin = await User.create({
            name: "Admin",
            email: "admin@gmail.com",
            password: "admin123",
            role: "admin",
        });

        console.log("ADMIN CREATED");

        process.exit();

    })
    .catch(err => {
        console.log(err);
        process.exit(1);
    });