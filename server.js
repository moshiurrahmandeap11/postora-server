import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { connectDB } from "./database/db.js";
dotenv.config();
const port = process.env.PORT;

const app = express();

app.use(cors());
app.use(express.json());


// connect with db
connectDB();


app.get("/", async(req, res) => {
    res.send("postora server running rapidly");
});


app.listen(port, () => {
    console.log(`postora server on port http://localhost:${port}`);
})
