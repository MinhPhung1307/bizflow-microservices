import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { initTables } from "./models/index.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

const app = express();

app.use(cookieParser());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Khởi tạo database
initTables();

// Routes
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/users", userRoutes);

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`Identity Service is running on port ${PORT}`);
});