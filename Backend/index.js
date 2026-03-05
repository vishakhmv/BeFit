import express from "express";
import pg from "pg";
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";
import dotenv from "dotenv";
import cors from "cors";
import multer from "multer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";

let port = 5000;
const saltRounds = 10;
dotenv.config();

let app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "befit",
  password: "",
  port: 5432,
});
db.connect();

app.post("/signup", async (req, res) => {
  try {
    let name = req.body.name;
    let email = req.body.email;
    let password = req.body.password;
    let dob = req.body.dob;
    let result = await db.query("select * from users where email=$1", [email]);
    if (result.rows.length === 0) {
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.error(err);
          res.status(500).json({ message: "Signup failed" });
        } else {
          const insertResult = await db.query(
            "INSERT INTO users (name, email, password, dob) VALUES ($1, $2, $3, $4) RETURNING *",
            [name, email, hash, dob],
          );

          const user = insertResult.rows[0];

          req.login(user, (err) => {
            if (err) {
              console.log(err);
              res.status(500).json({ message: "Login" });
            } else {
              res.json({ message: "Signup successful", user });
            }
          });
        }
      });
    } else {
      res.status(400).json({ message: "Email already exists" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Signup failed" });
  }
});

// app.post(
//   "/login",
//   passport.authenticate("local", {
//     successRedirect: "/home",
//     failureRedirect: "/login",
//   }),
// );

app.post("/login", passport.authenticate("local"), (req, res) => {
  res.json({ message: "Login successful", user: req.user });
});

passport.use(
  new Strategy({ usernameField: "email" }, async function verify(
    email,
    password,
    cb,
  ) {
    try {
      const result = await db.query("SELECT * FROM users WHERE email = $1", [
        email,
      ]);

      if (result.rows.length > 0) {
        const user = result.rows[0];
        const storedHashedPassword = user.password;

        bcrypt.compare(password, storedHashedPassword, (err, valid) => {
          if (err) {
            return cb(err);
          } else {
            if (valid) {
              return cb(null, user);
            } else {
              return cb(null, false, { message: "Incorrect password" });
            }
          }
        });
      } else {
        return cb(null, false, { message: "User not found" });
      }
    } catch (err) {
      return cb(err);
    }
  }),
);

app.get("/home", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
});

passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((user, cb) => {
  cb(null, user);
});

const upload = multer({ dest: "uploads/" });

const genAI = new GoogleGenerativeAI(process.env.APIKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

/* BLOOD EXTRACTION PROMPT*/
const BLOOD_PROMPT = `
You are a blood test analyzer.

User Details Provided:
- Age
- Gender
- Height
- Weight
- Current medications

IMPORTANT:
- Use these details to personalize advice.
- Do NOT repeat personal details in output.
- Do NOT diagnose diseases.
- If LOW or HIGH, clearly say:
  "Please consult a doctor. This is only AI guidance and not a medical diagnosis."

TASK:

For each blood parameter:

1. Provide:
   - name
   - value with unit
   - status (LOW / NORMAL / HIGH)

2. If LOW or HIGH:
   - issues (simple explanation)
   - whyItHappens (common reasons)
   - mention if current medicines may affect this (if relevant)

3. Provide:
   - dietPlan (structured daily plan)
   - waterIntakePerDay (adjust based on weight)
   - exercisePlan (safe for age)
   - dailyReminderSummary

4. If user is taking medicines:
   Add a warning:
   "Since you are taking medication, consult your doctor before changing diet or exercise."

OUTPUT JSON ONLY:

{
  "results": [
    {
      "name": "",
      "value": "",
      "status": "",
      "issues": "",
      "whyItHappens": "",
      "medicineInteractionNote": "",
      "dietPlan": {},
      "waterIntakePerDay": "",
      "exercisePlan": {},
      "dailyReminderSummary": ""
    }
  ]
}
`;

app.post("/analyze", upload.single("report"), async (req, res) => {
  try {
    const userDetails = `
Age: ${req.body.age}
Gender: ${req.body.gender}
Height: ${req.body.height}
Weight: ${req.body.weight}
Medications: ${req.body.medicines}
`;

    const imagePath = req.file.path;

    const imageData = fs.readFileSync(imagePath, {
      encoding: "base64",
    });

    const result = await model.generateContent([
      BLOOD_PROMPT + "\n\nUser Info:\n" + userDetails,
      {
        inlineData: {
          mimeType: "image/png",
          data: imageData,
        },
      },
    ]);

    const aiResponse = result.response.text();

    console.log(aiResponse);
  } catch (error) {
    console.error(error);
  }
});

app.listen(port, () => {
  console.log(`Your app is listening to port ${port}`);
});
