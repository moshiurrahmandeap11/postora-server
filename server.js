import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./database/db.js";

dotenv.config();
const port = process.env.PORT;

//  __dirname তৈরি করুন
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// import routes
import forgotPassword from "./routes/usersRoute/forgot-password.js";
import users from "./routes/usersRoute/users.js";

const app = express();


const allowedOrigins = [
  "http://localhost:3000",
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow Postman / server-to-server

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));
app.use(express.json());

// static files serve করুন
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// connect with db
connectDB();

// api endpoints
app.use("/api/users", users);
app.use("/api/users", forgotPassword);

app.get("/", async(req, res) => {
    res.send("postora server running rapidly");
});

app.listen(port, () => {
    console.log(`postora server on port http://localhost:${port}`);
});