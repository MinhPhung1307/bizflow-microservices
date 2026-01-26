import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { initTables } from "./models/index.js";

// --- GỘP ROUTES TỪ CẢ 2 NHÁNH ---
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";   // Của nhánh HEAD
import ownerRoutes from "./routes/ownerRoutes.js"; // Của nhánh Incoming

// --- RABBITMQ (Từ nhánh Incoming) ---
import { initLogConsumer } from "./config/rabbitmq.js";

dotenv.config();

const app = express();

app.use(cookieParser());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Khởi tạo database
initTables();

// --- KHAI BÁO ROUTES ---
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/users", userRoutes); // Route quản lý user
app.use("/owner", ownerRoutes); // Route quản lý owner

const PORT = process.env.PORT || 4001;

app.listen(PORT, async () => {
  console.log(`Identity Service is running on port ${PORT}`);
  
  // Khởi chạy Consumer để nhận log (Từ nhánh Incoming)
  try {
    await initLogConsumer();
    console.log("RabbitMQ Log Consumer initialized");
  } catch (error) {
    console.error("Failed to initialize Log Consumer:", error);
  }
});