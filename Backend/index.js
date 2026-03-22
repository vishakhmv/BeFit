import express from "express";
import pg from "pg";
import cors from "cors";
import dotenv from "dotenv";

// Load the hidden variables from your .env file
dotenv.config();

const port = 5000;
const app = express();

// Middleware (Crucial for React!)
app.use(cors()); // Allows your React app to talk to this backend
app.use(express.json()); // Allows the server to read JSON from React
app.use(express.urlencoded({ extended: true }));

// Connect using your secure .env variables
const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

db.connect()
  .then(() => console.log("✅ Connected to BeFit DB!"))
  .catch((err) => console.error("❌ DB connection error:", err.stack));

// Your Signup Route
app.post("/signup", async (req, res) => {
  try {
    // A cleaner way to extract variables from req.body
    let { name, email, password, dob } = req.body;

    await db.query(
      "INSERT INTO users (name, email, password, dob) VALUES ($1, $2, $3, $4)",
      [name, email, password, dob]
    );

    // Send a success message back to React instead of a redirect
    res.status(201).json({ message: "User registered successfully!" });
    
  } catch (error) {
    console.log(error);
    // Send an error message back to React
    res.status(500).json({ error: "Failed to register user" });
  }
});

app.listen(port, () => {
  console.log(`🚀 Your app is listening to port ${port}`);
});