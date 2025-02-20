import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import { UserModel } from "./models/User.js";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
  maxHttpBufferSize: 50 * 1024 * 1024,
});

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));

// API Routes
app.get("/api/images", async (req, res) => {
  try {
    // Get the last 24 users with images, sorted by creation date
    const users = await UserModel.find({ image: { $ne: null } })
      .sort({ createdAt: -1 })
      .limit(24)
      .select("image createdAt");

    // Send only the images array
    const images = users.map((user) => user.image);
    res.json(images);
  } catch (error) {
    console.error("Error fetching images:", error);
    res.status(500).json({ error: "Failed to fetch images" });
  }
});

// MongoDB Connection
mongoose
  .connect("mongodb://localhost:27017/curved-screen")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Socket.IO Connection
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("register_user", async (userData) => {
    try {
      console.log("Registering user:", userData);
      const user = new UserModel(userData);
      await user.save();
      io.emit("user_registered", user);
    } catch (error) {
      console.error("Registration error:", error);
      socket.emit("registration_error", error.message);
    }
  });

  socket.on("submit_image", async ({ userId, imageData }) => {
    console.log("Received image submission for user:", userId);
    console.log("Image data length:", imageData?.length);

    try {
      const user = await UserModel.findById(userId);
      if (user) {
        user.image = imageData;
        await user.save();
        console.log("Image saved for user:", userId);

        // Send the image to display view
        io.emit("new_image", imageData);

        socket.emit("reset_current_tablet");
        console.log("Images broadcast to all clients");
      } else {
        console.error("User not found:", userId);
        socket.emit("image_error", "User not found");
      }
    } catch (error) {
      console.error("Image submission error:", error);
      socket.emit("image_error", error.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = 3000;
const host = "0.0.0.0";
httpServer.listen(PORT, host, () => {
  console.log(`Server running on http://${host}:${PORT}`);
});
