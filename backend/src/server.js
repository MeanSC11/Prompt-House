import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import { router } from "./routes/index.js"; 

dotenv.config(); 

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
}));

app.use(express.json());

// ใช้งาน route ที่เรา import มา
app.use("/api", router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend on http://localhost:${PORT}`);
});
