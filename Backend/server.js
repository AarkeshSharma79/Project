import express from "express";
import cors from "cors";
import auditRouter from "./routes/audit.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/audit", auditRouter);

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});