import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { UserModel } from "./models/User.js"; // Ensure the path is correct

const MONGO_URI = "mongodb://localhost:27017/curved-screen";

// Get all images from the "images" folder
const imagePaths = fs
  .readdirSync(path.join(process.cwd(), "images"))
  .filter((file) => /\.(jpg|jpeg|png|gif)$/.test(file))
  .map((fileName) => path.join(process.cwd(), "images", fileName));

// Function to convert images to Base64
const convertImageToBase64 = (filePath) => {
  try {
    const fileData = fs.readFileSync(filePath);
    return `data:image/${path
      .extname(filePath)
      .slice(1)};base64,${fileData.toString("base64")}`;
  } catch (error) {
    console.error("Error reading file:", filePath, error);
    return null;
  }
};

// Convert all images
const base64Images = imagePaths.map(convertImageToBase64).filter(Boolean);

const seedDatabase = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Clear existing "Temp" users before inserting new ones
    await UserModel.deleteMany({ name: "Temp" });

    console.log("Seeding database with 24 placeholder users...");

    const users = [];
    for (let i = 0; i < 24; i++) {
      users.push({
        name: "Temp",
        image: base64Images[i % base64Images.length], // Cycle through images
        createdAt: new Date(),
      });
    }

    await UserModel.insertMany(users);
    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
};

// Run the seed function
seedDatabase();
