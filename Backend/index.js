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
  password: process.env.PASSWORD,
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

app.post("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    res.json({ message: "Logged out" });
  });
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
You are an AI blood test report analyzer.

The user will upload an image of a blood test report along with personal details.

User Details Provided:

* Age
* Gender
* Height
* Weight
* Current medications

IMPORTANT RULES:

1. Use the user details to personalize recommendations.
2. Do NOT repeat the user's personal details in the output.
3. Do NOT diagnose diseases.
4. If any parameter is LOW or HIGH, clearly state that the user should consult a doctor.
5. The analysis must be simple and easy for a normal person to understand.
6. If medicines are listed, explain whether the abnormal values could be influenced by those medicines.

ANTI-HALLUCINATION RULES:

1. Extract ONLY blood parameters and values clearly visible in the report.
2. NEVER guess, assume, or invent blood parameters or values.
3. If ANY value cannot be clearly read, RETURN THE ERROR RESPONSE immediately.
4. Do NOT create parameters that are not present in the report.
5. Copy values exactly as shown in the report including units.
6. If the report image is unclear, blurry, incomplete, or extraction is uncertain, RETURN THE ERROR RESPONSE.

ERROR RESPONSE:

If the report cannot be reliably analyzed, return ONLY this JSON:

{
"error": "Unable to reliably analyze the blood test report image"
}

If an error is returned:

* Do NOT generate results
* Do NOT generate dietPlan
* Do NOT generate exercisePlan
* Do NOT generate waterIntakePerDay
* Do NOT generate minimumSleepHours

TASK:

1. Extract ALL blood parameters visible in the report.

For EACH blood parameter provide:

* name
* value (with unit)
* status (LOW / NORMAL / HIGH / UNKNOWN)

If the status is LOW or HIGH also include:

* issues (simple explanation of what this means)
* whyItHappens (common causes)
* medicineInteractionNote (explain if the user's medicines could influence this result)

If the value is NORMAL:
issues = ""
whyItHappens = ""

DIET PLAN REQUIREMENTS:

Create a healthy weekly diet plan personalized for the user.

Rules:

1. Diet must be UNIQUE for each day.
2. Each day must include:

   * breakfast
   * lunch
   * snacks
   * dinner
3. Each meal must be an ARRAY of food suggestions.
4. Food suggestions should be simple and realistic.

EXERCISE PLAN REQUIREMENTS:

1. Provide a weekly exercise plan.
2. Each day must contain an ARRAY of exercises.
3. Exercises must be safe based on the user's age.

Also provide:

* waterIntakePerDay (based on user's weight)
* minimumSleepHours (recommended minimum hours of sleep per night based on age)

OUTPUT STRICT JSON ONLY.

OUTPUT FORMAT:

{
"results": [
{
"name": "",
"value": "",
"status": "",
"issues": "",
"whyItHappens": "",
"medicineInteractionNote": ""
}
],

"dietPlan": {
"monday": {
"breakfast": [],
"lunch": [],
"snacks": [],
"dinner": []
},
"tuesday": {
"breakfast": [],
"lunch": [],
"snacks": [],
"dinner": []
},
"wednesday": {
"breakfast": [],
"lunch": [],
"snacks": [],
"dinner": []
},
"thursday": {
"breakfast": [],
"lunch": [],
"snacks": [],
"dinner": []
},
"friday": {
"breakfast": [],
"lunch": [],
"snacks": [],
"dinner": []
},
"saturday": {
"breakfast": [],
"lunch": [],
"snacks": [],
"dinner": []
},
"sunday": {
"breakfast": [],
"lunch": [],
"snacks": [],
"dinner": []
}
},

"exercisePlan": {
"monday": [],
"tuesday": [],
"wednesday": [],
"thursday": [],
"friday": [],
"saturday": [],
"sunday": []
},

"waterIntakePerDay": "",
"minimumSleepHours": ""
}
`;

app.post("/analyze", upload.single("report"), async (req, res) => {
  let imagePath;
  try {
    const userDetails = `
Age: ${req.body.age}
Gender: ${req.body.gender}
Height: ${req.body.height}
Weight: ${req.body.weight}
Medications: ${req.body.medicines}
`;

    imagePath = req.file.path;

    const imageData = fs.readFileSync(imagePath, {
      encoding: "base64",
    });

    const result = await model.generateContent([
      BLOOD_PROMPT + "\n\nUser Info:\n" + userDetails,
      {
        inlineData: {
          mimeType: req.file.mimetype,
          data: imageData,
        },
      },
    ]);

    const aiResponse = result.response.text();
    const clean = aiResponse.replace(/```json|```/g, "");
    const parsed = JSON.parse(clean);
    if (parsed.error) {
      fs.unlinkSync(imagePath);
      return res.status(400).json(parsed);
    }
    fs.unlinkSync(imagePath);
    res.json(parsed);
  } catch (error) {
    if (imagePath && fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
    console.error(error);
    res.status(500).json({ message: "Analysis failed" });
  }
});

app.post("/save-tracker", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.id;

    const { dietPlan, exercisePlan, waterIntakePerDay, minimumSleepHours } =
      req.body;

    // save diet
    for (const day in dietPlan) {
      const meals = dietPlan[day];

      for (const food of meals.breakfast) {
        await db.query(
          "INSERT INTO diet (user_id, day, meal_time, food) VALUES ($1,$2,$3,$4)",
          [userId, day, "bf", food],
        );
      }

      for (const food of meals.lunch) {
        await db.query(
          "INSERT INTO diet (user_id, day, meal_time, food) VALUES ($1,$2,$3,$4)",
          [userId, day, "lu", food],
        );
      }

      for (const food of meals.snacks) {
        await db.query(
          "INSERT INTO diet (user_id, day, meal_time, food) VALUES ($1,$2,$3,$4)",
          [userId, day, "sn", food],
        );
      }

      for (const food of meals.dinner) {
        await db.query(
          "INSERT INTO diet (user_id, day, meal_time, food) VALUES ($1,$2,$3,$4)",
          [userId, day, "di", food],
        );
      }
    }

    // save exercise
    for (const day in exercisePlan) {
      for (const ex of exercisePlan[day]) {
        await db.query(
          "INSERT INTO exercise (user_id, day, exercise) VALUES ($1,$2,$3)",
          [userId, day, ex],
        );
      }
    }

    // save sleep
    await db.query("INSERT INTO sleep (user_id, sleep_hour) VALUES ($1,$2)", [
      userId,
      minimumSleepHours,
    ]);

    // save water
    await db.query("INSERT INTO water (user_id, water) VALUES ($1,$2)", [
      userId,
      waterIntakePerDay,
    ]);

    // update data and analysis_date
    await db.query(
      "UPDATE users SET data = 1, analysis_date = NOW() WHERE id = $1",
      [userId],
    );

    res.json({ message: "Tracker saved successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Saving tracker failed" });
  }
});

async function deleteExpiredData() {
  try {
    const result = await db.query(
      "SELECT id FROM users WHERE analysis_date IS NOT NULL AND analysis_date < NOW() - INTERVAL '30 days'",
    );

    for (const user of result.rows) {
      const userId = user.id;

      await db.query("DELETE FROM diet WHERE user_id=$1", [userId]);
      await db.query("DELETE FROM exercise WHERE user_id=$1", [userId]);
      await db.query("DELETE FROM sleep WHERE user_id=$1", [userId]);
      await db.query("DELETE FROM water WHERE user_id=$1", [userId]);

      await db.query("UPDATE users SET data = 0 WHERE id=$1", [userId]);
    }

    console.log("Expired user tracker data cleaned");
  } catch (err) {
    console.error(err);
  }
}

app.post("/reset-tracker", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.id;

    await db.query("DELETE FROM diet WHERE user_id=$1", [userId]);
    await db.query("DELETE FROM exercise WHERE user_id=$1", [userId]);
    await db.query("DELETE FROM sleep WHERE user_id=$1", [userId]);
    await db.query("DELETE FROM water WHERE user_id=$1", [userId]);

    await db.query(
      "UPDATE users SET data = 0, analysis_date = NULL WHERE id=$1",
      [userId],
    );

    res.json({ message: "Tracker reset successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Reset failed" });
  }
});

setInterval(deleteExpiredData, 1000 * 60 * 60 * 24);

app.listen(port, () => {
  console.log(`Your app is listening to port ${port}`);
});
