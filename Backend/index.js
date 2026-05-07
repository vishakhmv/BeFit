import express from "express";
import pg from "pg";
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";
import multer from "multer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import cors from "cors";
import dotenv from "dotenv";
import twilio from "twilio";
import cron from "node-cron";
import nodemailer from "nodemailer";
// Load the hidden variables from your .env file
dotenv.config();

let port = 5000;
const saltRounds = 10;

let app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Teammate's secure CORS settings for React and Passport
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3003",
      "http://localhost:3005",
    ],
    credentials: true,
  }),
);

app.use(
  session({
    secret: process.env.SECRET || "default_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      sameSite: "lax",
      secure: false,
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

// Use a pool so concurrent API/cron queries are safe.
const db = new pg.Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

db.query("SELECT 1")
  .then(() => console.log("Connected to BeFit DB securely!"))
  .catch((err) => console.error("DB connection error:", err.stack));

// Connect to Twilio
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);

// Setup Nodemailer for email OTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Generate OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send Email OTP
app.post("/send-email-otp", async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Check if email already exists
    const userCheck = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Insert OTP into signup_verification_otp table
    await db.query(
      "INSERT INTO signup_verification_otp (email, otp, verification_type, expires_at) VALUES ($1, $2, $3, $4)",
      [email, otp, 'email', expiresAt]
    );

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "BeFit Email Verification OTP",
      html: `<h2>Your BeFit Email Verification Code</h2>
             <p>Your OTP is: <strong>${otp}</strong></p>
             <p>This code will expire in 10 minutes.</p>`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

// Verify Email OTP
app.post("/verify-email-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP required" });
    }

    const result = await db.query(
      "SELECT * FROM signup_verification_otp WHERE email = $1 AND otp = $2 AND verification_type = $3",
      [email, otp, 'email']
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const record = result.rows[0];
    if (new Date() > new Date(record.expires_at)) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    // Mark as verified
    await db.query(
      "UPDATE signup_verification_otp SET is_verified = TRUE WHERE email = $1 AND verification_type = $2",
      [email, 'email']
    );

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Verification failed" });
  }
});

// Send WhatsApp OTP
app.post("/send-whatsapp-otp", async (req, res) => {
  try {
    const { whatsapp } = req.body;

    if (!whatsapp) {
      return res.status(400).json({ message: "WhatsApp number is required" });
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(whatsapp)) {
      return res.status(400).json({ message: "Invalid WhatsApp number" });
    }

    const otp = generateOtp();
    const whatsappNumber = "+91" + whatsapp;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Send WhatsApp message via Twilio
    await twilioClient.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${whatsappNumber}`,
      body: `Your BeFit WhatsApp verification code is: ${otp}\nCode expires in 10 minutes.`,
    });

    // Store OTP in database
    await db.query(
      "INSERT INTO signup_verification_otp (whatsapp, otp, verification_type, expires_at) VALUES ($1, $2, $3, $4)",
      [whatsapp, otp, 'whatsapp', expiresAt]
    );

    res.json({ message: "OTP sent to WhatsApp" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to send WhatsApp OTP" });
  }
});

// Verify WhatsApp OTP
app.post("/verify-whatsapp-otp", async (req, res) => {
  try {
    const { whatsapp, otp } = req.body;

    if (!whatsapp || !otp) {
      return res.status(400).json({ message: "WhatsApp number and OTP required" });
    }

    const result = await db.query(
      "SELECT * FROM signup_verification_otp WHERE whatsapp = $1 AND otp = $2 AND verification_type = $3",
      [whatsapp, otp, 'whatsapp']
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const record = result.rows[0];
    if (new Date() > new Date(record.expires_at)) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    // Mark as verified
    await db.query(
      "UPDATE signup_verification_otp SET is_verified = TRUE WHERE whatsapp = $1 AND verification_type = $2",
      [whatsapp, 'whatsapp']
    );

    res.json({ message: "WhatsApp verified successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Verification failed" });
  }
});

// Teammate's Secure Signup Route
app.post("/signup", async (req, res) => {
  try {
    let name = req.body.name;
    let email = req.body.email;
    let password = req.body.password;
    let dob = req.body.dob;
    let whatsapp = req.body.whatsapp;
    let sex = req.body.sex;
    let food = req.body.food;
    let state = req.body.state;

    // Verify email has been verified via OTP
    const emailVerified = await db.query(
      "SELECT * FROM password_reset_otp WHERE email = $1 AND is_verified = TRUE",
      [email]
    );

    if (emailVerified.rows.length === 0) {
      return res.status(400).json({ message: "Email not verified" });
    }

    // Verify WhatsApp has been verified via OTP
    global.whatsappOtps = global.whatsappOtps || {};
    if (!global.whatsappOtps[whatsapp] || !global.whatsappOtps[whatsapp].verified) {
      return res.status(400).json({ message: "WhatsApp not verified" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // 2. Validate WhatsApp Number (Must be exactly 10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(whatsapp)) {
      return res
        .status(400)
        .json({ message: "WhatsApp number must be exactly 10 digits" });
    }

    // 3. Validate Date of Birth (Must be a valid date and NOT in the future)
    const dobDate = new Date(dob);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(dobDate.getTime())) {
      return res.status(400).json({ message: "Invalid Date of Birth" });
    }
    if (dobDate >= today) {
      return res
        .status(400)
        .json({ message: "Date of Birth cannot be a future date or today" });
    }
    let result = await db.query("select * from users where email=$1", [email]);

    if (result.rows.length === 0) {
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.error(err);
          res.status(500).json({ message: "Signup failed" });
        } else {
          // Add country code for Twilio WhatsApp
          const whatsappNumber = "+91" + whatsapp;
          const insertResult = await db.query(
            "INSERT INTO users (name, email, password, dob, whatsapp_number, sex, food, cstate) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
            [name, email, hash, dob, whatsappNumber, sex, food, state],
          );

          const user = insertResult.rows[0];

          // Clean up OTP records after successful signup
          await db.query("DELETE FROM password_reset_otp WHERE email = $1", [email]);
          delete global.whatsappOtps[whatsapp];

          req.login(user, (err) => {
            if (err) {
              console.log(err);
              res.status(500).json({ message: "Login" });
            } else {
              req.session.save((err) => {
                if (err) {
                  console.log("Session save error:", err);
                  return res.status(500).json({ message: "Session error" });
                }
                res.json({ message: "Signup successful", user });
              });
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

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "application/pdf",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only images (JPG, PNG, WEBP) and PDFs are allowed.",
        ),
      );
    }
  },
});

// Generative AI Connection
const genAI = new GoogleGenerativeAI(process.env.APIKey);
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

/* BLOOD EXTRACTION PROMPT*/
const BLOOD_PROMPT = `
You are an AI blood test report analyzer.

The user will upload an image OR a PDF document of a blood test report along with personal details.

User Details Provided:
* Age 
* Gender
* Height
* Weight
* State (Location for regional cuisine)
* Dietary Preference (Veg/Non-Veg)

IMPORTANT RULES:
1. VALIDATION: First, verify that the uploaded image or document is actually a medical blood test report. If it is NOT a blood test report (e.g., a random photo, a selfie, a receipt, or an unrelated document), you MUST immediately return the ERROR RESPONSE and stop processing.
2. Use the user details to personalize recommendations.
3. Do NOT repeat the user's personal details in the output.
4. Do NOT diagnose diseases.
5. If any parameter is LOW or HIGH, clearly state that the user should consult a doctor.
6. Keep the analysis simple and easy to understand.

ANTI-HALLUCINATION & EVALUATION RULES:
1. Extract ONLY visible parameters.
2. NEVER guess or assume the patient's actual test values.
3. EXCEPTION TO RULE 2 (MISSING RANGES): If the physical report does NOT provide a reference range for a specific parameter,
 you MUST use standard global medical reference ranges to evaluate if the status is LOW, NORMAL, or HIGH. 
 Only use UNKNOWN if the parameter name itself is completely illegible.
4. Copy values exactly with units.

ERROR RESPONSE:
{
"error": "Unable to reliably analyze the blood test report image"
}

If error → STOP.

TASK:
Extract ALL visible blood parameters.

For EACH parameter return:
* extractedName (Copy exactly what is written on the report, e.g., "Hct" or "RDW-CV")
* expandedName (The full medical name. e.g., "Hematocrit (Hct)". If it is already a full name, just copy it.)
* value (with unit)
* status (LOW / NORMAL / HIGH / UNKNOWN)
* issues
* whyItHappens
* summary
* whatIfLow
* whatIfHigh

RULES:
1. If status = LOW:
 - issues → simple meaning of the low result
 - whyItHappens → common causes for this low result
 - summary → A simple, 1-2 sentence educational definition of what this blood parameter actually measures in the human body.
- whatIfLow → explain what LOW means for this parameter
- whatIfHigh → explain what HIGH would mean for this parameter

2. If status = HIGH:
 - issues → simple meaning of the high result
 - whyItHappens → common causes for this high result
 - summary → A simple, 1-2 sentence educational definition of what this blood parameter actually measures in the human body.
- whatIfLow → explain what LOW would mean for this parameter
- whatIfHigh → explain what HIGH means for this parameter

3. If status = NORMAL:
- issues = "none"
- whyItHappens = "none"
- summary → A simple, 1-2 sentence educational definition of what this blood parameter actually measures in the human body.
- whatIfLow → explain what LOW would mean for this parameter
- whatIfHigh → explain what HIGH would mean for this parameter

4. If status = UNKNOWN:
- issues = "unclear"
- whyItHappens = "unclear"
- summary → A simple, 1-2 sentence educational definition of what this blood parameter actually measures in the human body.
- whatIfLow → general explanation if low
- whatIfHigh → general explanation if high

EXECUTIVE SUMMARY REQUIREMENTS:
Generate a holistic action plan based on the abnormal values found.
1. futureOutlook: A brief, motivating intro on how fixing these specific abnormal values will improve their life and future health.
2. keyFocusAreas: An array of the top 2-3 medical issues to focus on.
3. dietaryFocus: Specific food advice to correct the abnormal values.
 This MUST strictly align with the user's Dietary Preference (Veg/Non-Veg) and highlight accessible regional dishes popular in their State.
4. estimatedCalories: An estimated daily calorie goal based on their height, weight, age, and gender.
5. estimatedProtein: An estimated daily protein goal (in grams) based on their weight.
6. lifestyleAdvice: Specific exercise and sleep adjustments needed for their specific blood results.

DIET PLAN:
Create a healthy weekly diet plan personalized for the user.
Rules:
1. Diet must be UNIQUE for each day.
2. Each day must include: breakfast, lunch, snacks, dinner.
3. Each meal must be an ARRAY of food suggestions.
4. CRITICAL: All food suggestions MUST strictly match the user's Dietary Preference (Veg/Non-Veg).
5. CRITICAL: The meals must heavily feature local, practical, and traditional cuisine based on the user's State.

EXERCISE PLAN REQUIREMENTS:
1. Provide a weekly exercise plan.
2. Each day must contain an ARRAY of exercises.

Also provide:
* waterIntakePerDay (based on user's weight)
* minimumSleepHours (recommended minimum hours of sleep per night based on age)

OUTPUT STRICT JSON ONLY.

OUTPUT FORMAT:
{
"executiveSummary": {
  "futureOutlook": "",
  "keyFocusAreas": [],
  "dietaryFocus": "",
  "estimatedCalories": "",
  "estimatedProtein": "",
  "lifestyleAdvice": ""
},
"results": [
{
"extractedName": "",
"expandedName": "",
"value": "",
"status": "",
"issues": "",
"whyItHappens": "",
"summary": "",
"whatIfLow": "",
"whatIfHigh": ""
}
],
"dietPlan": {
"monday": { "breakfast": [], "lunch": [], "snacks": [], "dinner": [] },
"tuesday": { "breakfast": [], "lunch": [], "snacks": [], "dinner": [] },
"wednesday": { "breakfast": [], "lunch": [], "snacks": [], "dinner": [] },
"thursday": { "breakfast": [], "lunch": [], "snacks": [], "dinner": [] },
"friday": { "breakfast": [], "lunch": [], "snacks": [], "dinner": [] },
"saturday": { "breakfast": [], "lunch": [], "snacks": [], "dinner": [] },
"sunday": { "breakfast": [], "lunch": [], "snacks": [], "dinner": [] }
},
"exercisePlan": {
"monday": [], "tuesday": [], "wednesday": [], "thursday": [], "friday": [], "saturday": [], "sunday": []
},
"waterIntakePerDay": "",
"minimumSleepHours": ""
}
`;
// --- HELPER FUNCTION: Fetch formatted data from DB ---
const getAnalysisFromDB = async (userId) => {
  const summaryRes = await db.query(
    "SELECT * FROM executive_summary WHERE user_id=$1",
    [userId],
  );
  const resultsRes = await db.query(
    "SELECT * FROM blood_results WHERE user_id=$1",
    [userId],
  );
  const sleepRes = await db.query(
    "SELECT sleep_hour FROM sleep WHERE user_id=$1 ORDER BY id DESC LIMIT 1",
    [userId],
  );
  const waterRes = await db.query(
    "SELECT water FROM water WHERE user_id=$1 ORDER BY id DESC LIMIT 1",
    [userId],
  );

  if (summaryRes.rows.length === 0) return null;

  return {
    executiveSummary: {
      futureOutlook: summaryRes.rows[0].future_outlook,
      keyFocusAreas: summaryRes.rows[0].key_focus_areas,
      dietaryFocus: summaryRes.rows[0].dietary_focus,
      estimatedCalories: summaryRes.rows[0].estimated_calories,
      estimatedProtein: summaryRes.rows[0].estimated_protein,
      lifestyleAdvice: summaryRes.rows[0].lifestyle_advice,
    },
    results: resultsRes.rows.map((r) => ({
      extractedName: r.extracted_name,
      expandedName: r.expanded_name,
      name: r.expanded_name || r.extracted_name || "Unknown Parameter",
      value: r.test_value,
      status: r.status,
      issues: r.issues,
      whyItHappens: r.why_it_happens,
      summary: r.summary,
      whatIfLow: r.what_if_low,
      whatIfHigh: r.what_if_high,
    })),
    waterIntakePerDay: waterRes.rows[0]?.water || "2-3 liters/day",
    minimumSleepHours: sleepRes.rows[0]?.sleep_hour || "7-8",
  };
};

// --- UPDATED /analyze ROUTE ---
app.post(
  "/analyze",
  async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res
        .status(401)
        .json({ message: "Unauthorized. Please log in first." });
    }
    next();
  },
  (req, res, next) => {
    upload.single("report")(req, res, (err) => {
      if (err) return res.status(400).json({ message: err.message });
      next();
    });
  },
  async (req, res) => {
    let imagePath;
    try {
      if (!req.body.height || !req.body.weight) {
        if (req.file && req.file.path) {
          if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        }
        return res
          .status(400)
          .json({ message: "Height and weight are mandatory fields." });
      }
      if (!req.file)
        return res.status(400).json({ message: "No file uploaded." });

      const userId = req.user.id;
      const userRecord = await db.query(
        "SELECT dob, sex, cstate, food FROM users WHERE id = $1",
        [userId],
      );
      const dbUser = userRecord.rows[0];
      const calculateAge = (dob) =>
        Math.floor((new Date() - new Date(dob).getTime()) / 3.15576e10);

      const userDetails = `
Age: ${calculateAge(dbUser.dob)}
Gender: ${dbUser.sex}
Height: ${req.body.height} 
Weight: ${req.body.weight} 
State: ${dbUser.cstate}
food: ${dbUser.food}
`;

      imagePath = req.file.path;
      const imageData = fs.readFileSync(imagePath, { encoding: "base64" });

      const result = await model.generateContent([
        BLOOD_PROMPT + "\n\nUser Info:\n" + userDetails,
        {
          inlineData: { mimeType: req.file.mimetype, data: imageData },
        },
      ]);

      const aiResponse = result.response.text();
      let parsed;
      try {
        const clean = aiResponse.replace(/```json|```/g, "").trim();
        parsed = JSON.parse(clean);
      } catch (parseError) {
        console.error("Failed to parse Gemini output:");
        if (imagePath && fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        return res.status(500).json({
          message: "AI generated an invalid response format. Please try again.",
        });
      }

      if (parsed.error) {
        fs.unlinkSync(imagePath);
        return res.status(400).json(parsed);
      }

      // Format parameter names
      if (Array.isArray(parsed.results)) {
        parsed.results = parsed.results.map((item = {}) => {
          const status = (item.status || "UNKNOWN").toUpperCase();
          const expandedName =
            typeof item.expandedName === "string" && item.expandedName.trim()
              ? item.expandedName.trim()
              : "";
          const extractedName =
            typeof item.extractedName === "string" && item.extractedName.trim()
              ? item.extractedName.trim()
              : "";
          const fallbackName =
            typeof item.name === "string" && item.name.trim()
              ? item.name.trim()
              : "";
          const normalizedName =
            expandedName ||
            fallbackName ||
            extractedName ||
            "Unknown Parameter";

          return {
            ...item,
            extractedName: extractedName || fallbackName || normalizedName,
            expandedName:
              expandedName || fallbackName || extractedName || normalizedName,
            name: normalizedName,
            summary:
              typeof item.summary === "string" && item.summary.trim()
                ? item.summary
                : "Summary not available.",
            whatIfLow:
              typeof item.whatIfLow === "string" && item.whatIfLow.trim()
                ? item.whatIfLow
                : status === "LOW"
                  ? "Already low in this report."
                  : "If this parameter becomes low, consult a doctor for evaluation.",
            whatIfHigh:
              typeof item.whatIfHigh === "string" && item.whatIfHigh.trim()
                ? item.whatIfHigh
                : status === "HIGH"
                  ? "Already high in this report."
                  : "If this parameter becomes high, consult a doctor for evaluation.",
          };
        });
      }

      // 1. DELETE OLD DATA
      await db.query("DELETE FROM executive_summary WHERE user_id=$1", [
        userId,
      ]);
      await db.query("DELETE FROM blood_results WHERE user_id=$1", [userId]);
      await db.query("DELETE FROM diet WHERE user_id=$1", [userId]);
      await db.query("DELETE FROM exercise WHERE user_id=$1", [userId]);
      await db.query("DELETE FROM sleep WHERE user_id=$1", [userId]);
      await db.query("DELETE FROM water WHERE user_id=$1", [userId]);

      // 2. INSERT EXECUTIVE SUMMARY
      const es = parsed.executiveSummary;
      await db.query(
        `INSERT INTO executive_summary (user_id, future_outlook, key_focus_areas, dietary_focus,
         estimated_calories, estimated_protein, lifestyle_advice) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          userId,
          es.futureOutlook,
          JSON.stringify(es.keyFocusAreas),
          es.dietaryFocus,
          es.estimatedCalories,
          es.estimatedProtein,
          es.lifestyleAdvice,
        ],
      );

      // 3. INSERT BLOOD RESULTS
      for (const resItem of parsed.results) {
        await db.query(
          `INSERT INTO blood_results (user_id, extracted_name, expanded_name, test_value, status, issues, 
          why_it_happens, summary, what_if_low, what_if_high) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            userId,
            resItem.extractedName,
            resItem.expandedName,
            resItem.value,
            resItem.status,
            resItem.issues,
            resItem.whyItHappens,
            resItem.summary,
            resItem.whatIfLow,
            resItem.whatIfHigh,
          ],
        );
      }

      // 4. INSERT TRACKER DATA (Diet, Exercise, Sleep, Water)
      const dayOrder = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ];
      const dietPlan = parsed.dietPlan || {};
      const exercisePlan = parsed.exercisePlan || {};

      for (const day of dayOrder) {
        const meals = dietPlan[day] || {};
        const breakfasts = Array.isArray(meals.breakfast)
          ? meals.breakfast
          : [];
        const lunches = Array.isArray(meals.lunch) ? meals.lunch : [];
        const snacks = Array.isArray(meals.snacks) ? meals.snacks : [];
        const dinners = Array.isArray(meals.dinner) ? meals.dinner : [];

        for (const food of breakfasts)
          await db.query(
            "INSERT INTO diet (user_id, day, meal_time, food) VALUES ($1,$2,$3,$4)",
            [userId, day, "bf", food],
          );
        for (const food of lunches)
          await db.query(
            "INSERT INTO diet (user_id, day, meal_time, food) VALUES ($1,$2,$3,$4)",
            [userId, day, "lu", food],
          );
        for (const food of snacks)
          await db.query(
            "INSERT INTO diet (user_id, day, meal_time, food) VALUES ($1,$2,$3,$4)",
            [userId, day, "sn", food],
          );
        for (const food of dinners)
          await db.query(
            "INSERT INTO diet (user_id, day, meal_time, food) VALUES ($1,$2,$3,$4)",
            [userId, day, "di", food],
          );

        const dayExercises = Array.isArray(exercisePlan[day])
          ? exercisePlan[day]
          : [];
        for (const ex of dayExercises) {
          await db.query(
            "INSERT INTO exercise (user_id, day, exercise) VALUES ($1,$2,$3)",
            [userId, day, ex],
          );
        }
      }

      await db.query("INSERT INTO sleep (user_id, sleep_hour) VALUES ($1,$2)", [
        userId,
        parsed.minimumSleepHours || "7-8",
      ]);
      await db.query("INSERT INTO water (user_id, water) VALUES ($1,$2)", [
        userId,
        parsed.waterIntakePerDay || "2-3 liters/day",
      ]);

      // Update data flag
      await db.query(
        "UPDATE users SET cdata = 1, analysis_date = NOW() WHERE id = $1",
        [userId],
      );

      // 5. FETCH FROM DB & RETURN (Ensures UI only gets what is saved)
      const finalData = await getAnalysisFromDB(userId);
      fs.unlinkSync(imagePath);
      res.json(finalData);
    } catch (error) {
      if (imagePath && fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      console.error(error);
      res.status(500).json({ message: "Analysis failed" });
    }
  },
);

// --- UPDATED /get-analysis ROUTE ---
app.get("/get-analysis", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    // You need to call your helper function here!
    const finalData = await getAnalysisFromDB(req.user.id);
    if (!finalData) {
      return res.status(404).json({ message: "No analysis found." });
    }
    res.json(finalData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch analysis" });
  }
});
app.post("/save-tracker", async (req, res) => {
  console.log("clicked /save-tracker");

  try {
    if (!req.isAuthenticated()) {
      console.log("Blocked! User is not logged in (Session wiped).");
      return res.status(401).json({ message: "Unauthorized" });
    }

    console.log("User is authenticated. Saving data...");
    const userId = req.user.id;
    const dayOrder = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    const rawDietPlan =
      req.body?.dietPlan && typeof req.body.dietPlan === "object"
        ? req.body.dietPlan
        : {};
    const rawExercisePlan =
      req.body?.exercisePlan && typeof req.body.exercisePlan === "object"
        ? req.body.exercisePlan
        : {};
    const waterIntakePerDay = req.body?.waterIntakePerDay || "2-3 liters/day";
    const minimumSleepHours = req.body?.minimumSleepHours || "7-8";

    const dietPlan = Object.fromEntries(
      Object.entries(rawDietPlan).map(([day, meals]) => [
        String(day).toLowerCase(),
        meals,
      ]),
    );
    const exercisePlan = Object.fromEntries(
      Object.entries(rawExercisePlan).map(([day, exercises]) => [
        String(day).toLowerCase(),
        exercises,
      ]),
    );

    await db.query("DELETE FROM diet WHERE user_id=$1", [userId]);
    await db.query("DELETE FROM exercise WHERE user_id=$1", [userId]);
    await db.query("DELETE FROM sleep WHERE user_id=$1", [userId]);
    await db.query("DELETE FROM water WHERE user_id=$1", [userId]);

    for (const day of dayOrder) {
      const meals = dietPlan[day] || {};
      const breakfasts = Array.isArray(meals.breakfast) ? meals.breakfast : [];
      const lunches = Array.isArray(meals.lunch) ? meals.lunch : [];
      const snacks = Array.isArray(meals.snacks) ? meals.snacks : [];
      const dinners = Array.isArray(meals.dinner) ? meals.dinner : [];

      for (const food of breakfasts) {
        await db.query(
          "INSERT INTO diet (user_id, day, meal_time, food) VALUES ($1,$2,$3,$4)",
          [userId, day, "bf", food],
        );
      }
      for (const food of lunches) {
        await db.query(
          "INSERT INTO diet (user_id, day, meal_time, food) VALUES ($1,$2,$3,$4)",
          [userId, day, "lu", food],
        );
      }
      for (const food of snacks) {
        await db.query(
          "INSERT INTO diet (user_id, day, meal_time, food) VALUES ($1,$2,$3,$4)",
          [userId, day, "sn", food],
        );
      }
      for (const food of dinners) {
        await db.query(
          "INSERT INTO diet (user_id, day, meal_time, food) VALUES ($1,$2,$3,$4)",
          [userId, day, "di", food],
        );
      }
    }

    // 3. Save Exercise
    for (const day of dayOrder) {
      const dayExercises = Array.isArray(exercisePlan[day])
        ? exercisePlan[day]
        : [];
      for (const ex of dayExercises) {
        await db.query(
          "INSERT INTO exercise (user_id, day, exercise) VALUES ($1,$2,$3)",
          [userId, day, ex],
        );
      }
    }

    // 4. Save Sleep
    await db.query("INSERT INTO sleep (user_id, sleep_hour) VALUES ($1,$2)", [
      userId,
      minimumSleepHours,
    ]);

    // 5. Save Water (Keeping your simple text version for now!)
    await db.query("INSERT INTO water (user_id, water) VALUES ($1,$2)", [
      userId,
      waterIntakePerDay,
    ]);

    // 6. Update data and analysis_date
    await db.query(
      "UPDATE users SET cdata = 1, analysis_date = NOW() WHERE id = $1",
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

      await db.query("DELETE FROM executive_summary WHERE user_id=$1", [
        userId,
      ]);
      await db.query("DELETE FROM blood_results WHERE user_id=$1", [userId]);

      await db.query("UPDATE users SET cdata = 0 WHERE id=$1", [userId]);
    }

    console.log("Expired user tracker data cleaned");
  } catch (err) {
    console.error(err);
  }
}
setInterval(deleteExpiredData, 1000 * 60 * 60 * 24);

app.get("/get-tracker", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.id;

    // check data flag first
    const userResult = await db.query("SELECT cdata FROM users WHERE id=$1", [
      userId,
    ]);
    const user = userResult.rows[0];

    if (!user || user.cdata === 0) {
      return res.json({ hasData: false });
    }

    const diet = await db.query("SELECT * FROM diet WHERE user_id=$1", [
      userId,
    ]);
    const exercise = await db.query("SELECT * FROM exercise WHERE user_id=$1", [
      userId,
    ]);
    const sleep = await db.query(
      "SELECT * FROM sleep WHERE user_id=$1 ORDER BY id DESC LIMIT 1",
      [userId],
    );
    const water = await db.query(
      "SELECT * FROM water WHERE user_id=$1 ORDER BY id DESC LIMIT 1",
      [userId],
    );

    res.json({
      hasData: true,
      diet: diet.rows,
      exercise: exercise.rows,
      sleep: sleep.rows[0] || null,
      water: water.rows[0] || null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch tracker" });
  }
});

// TWILIO WHATSAPP BOT: THE DAILY COACH

// Helper function to get today's day in lowercase (e.g., "monday")
const getTodayName = () => {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
  })
    .format(new Date())
    .toLowerCase();
};

const formatList = (items, fallback) => {
  if (!Array.isArray(items) || items.length === 0) return fallback;
  return items.join(", ");
};

const getUsersWithWhatsapp = async () => {
  const users = await db.query(
    "SELECT id, name, whatsapp_number FROM users WHERE whatsapp_number IS NOT NULL AND cdata = 1",
  );
  return users.rows;
};

const getDailyPlanForUser = async (userId, day) => {
  const [dietRows, exerciseRows, waterRow, sleepRow] = await Promise.all([
    db.query("SELECT meal_time, food FROM diet WHERE user_id=$1 AND day=$2", [
      userId,
      day,
    ]),
    db.query("SELECT exercise FROM exercise WHERE user_id=$1 AND day=$2", [
      userId,
      day,
    ]),
    db.query(
      "SELECT water FROM water WHERE user_id=$1 ORDER BY id DESC LIMIT 1",
      [userId],
    ),
    db.query(
      "SELECT sleep_hour FROM sleep WHERE user_id=$1 ORDER BY id DESC LIMIT 1",
      [userId],
    ),
  ]);

  const meals = { bf: [], lu: [], sn: [], di: [] };
  for (const row of dietRows.rows) {
    if (row.meal_time && meals[row.meal_time]) {
      meals[row.meal_time].push(row.food);
    }
  }

  return {
    breakfast: meals.bf,
    lunch: meals.lu,
    snacks: meals.sn,
    dinner: meals.di,
    exercises: exerciseRows.rows.map((r) => r.exercise),
    water: waterRow.rows[0]?.water || "plenty of water",
    sleep: sleepRow.rows[0]?.sleep_hour || "7-8 hours",
  };
};

// In-process guard: prevents duplicate sends for the same user/slot/day.
const sentReminderKeys = new Set();

const getTodayISODateInIST = () => {
  const now = new Date();
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
};

const hasAlreadySentForSlot = (userId, slotName) => {
  const key = `${getTodayISODateInIST()}:${slotName}:${userId}`;
  if (sentReminderKeys.has(key)) return true;
  sentReminderKeys.add(key);
  return false;
};

const getISTHour = () => {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      hour12: false,
    }).format(new Date()),
  );
};

const isWithinHourWindowIST = (startHourInclusive, endHourExclusive) => {
  const hour = getISTHour();
  return hour >= startHourInclusive && hour < endHourExclusive;
};

const isWithinBreakfastWindowIST = () => isWithinHourWindowIST(8, 10);

const isWithinLunchWindowIST = () => {
  return isWithinHourWindowIST(12, 14);
};

const isWithinEveningWindowIST = () => isWithinHourWindowIST(17, 19);

const isWithinNightWindowIST = () => isWithinHourWindowIST(20, 22);

const sendBreakfastReminders = async (source = "cron") => {
  const today = getTodayName();
  const users = await getUsersWithWhatsapp();
  let sentCount = 0;

  for (const user of users) {
    if (hasAlreadySentForSlot(user.id, "breakfast")) continue;

    const plan = await getDailyPlanForUser(user.id, today);
    if (plan.breakfast.length === 0 && plan.exercises.length === 0) continue;

    const breakfast = formatList(plan.breakfast, "A balanced breakfast");
    const gym = formatList(plan.exercises, "Light activity and stretching");

    const msg = `Good morning BeFit Champion!\n\nBreakfast: ${breakfast}\n\nWorkout Goal: ${gym}\n\nHydration: Start your day right with a glass of water. (Goal: ${plan.water})`;
    await twilioClient.messages.create({
      from: "whatsapp:+14155238886",
      to: `whatsapp:${user.whatsapp_number}`,
      body: msg,
    });
    sentCount += 1;
  }

  console.log(
    `[BREAKFAST ${source.toUpperCase()}] Sent reminders: ${sentCount}`,
  );
};

const sendLunchReminders = async (source = "cron") => {
  const today = getTodayName();
  const users = await getUsersWithWhatsapp();
  let sentCount = 0;

  for (const user of users) {
    if (hasAlreadySentForSlot(user.id, "lunch")) continue;

    const plan = await getDailyPlanForUser(user.id, today);
    const lunch = formatList(plan.lunch, "A nutritious lunch plate");

    const msg = `It's lunchtime!\n\nToday's Lunch: ${lunch}\n\nHydration Check: Make sure you are drinking enough to hit your ${plan.water} goal today!`;
    await twilioClient.messages.create({
      from: "whatsapp:+14155238886",
      to: `whatsapp:${user.whatsapp_number}`,
      body: msg,
    });
    sentCount += 1;
  }

  console.log(
    `[LUNCH ${source.toUpperCase()}] Sent lunch reminders: ${sentCount}`,
  );
};

const sendEveningReminders = async (source = "cron") => {
  const today = getTodayName();
  const users = await getUsersWithWhatsapp();
  let sentCount = 0;

  for (const user of users) {
    if (hasAlreadySentForSlot(user.id, "snacks")) continue;

    const plan = await getDailyPlanForUser(user.id, today);
    if (plan.snacks.length === 0 && plan.exercises.length === 0) continue;

    const snacks = formatList(plan.snacks, "A healthy protein-rich snack");

    const msg = `Afternoon slump? Time for a snack!\n\nSnack: ${snacks}\n\nGym Check: If you haven't done your workout yet, go crush it!\n\nHydration: Keep sipping! You are on your way to ${plan.water}.`;
    await twilioClient.messages.create({
      from: "whatsapp:+14155238886",
      to: `whatsapp:${user.whatsapp_number}`,
      body: msg,
    });
    sentCount += 1;
  }

  console.log(`[EVENING ${source.toUpperCase()}] Sent reminders: ${sentCount}`);
};

const sendNightReminders = async (source = "cron") => {
  const today = getTodayName();
  const users = await getUsersWithWhatsapp();
  let sentCount = 0;

  for (const user of users) {
    if (hasAlreadySentForSlot(user.id, "dinner")) continue;

    const plan = await getDailyPlanForUser(user.id, today);
    if (plan.dinner.length === 0) continue;

    const dinner = formatList(plan.dinner, "A light and balanced dinner");

    const msg = `Good evening! Time to refuel.\n\nDinner: ${dinner}\n\nFinal Hydration: Finish up your ${plan.water} goal for the day, but don't drink too much right before bed!`;
    await twilioClient.messages.create({
      from: "whatsapp:+14155238886",
      to: `whatsapp:${user.whatsapp_number}`,
      body: msg,
    });
    sentCount += 1;
  }

  console.log(`[NIGHT ${source.toUpperCase()}] Sent reminders: ${sentCount}`);
};

// 1. MORNING (8:00 AM IST) - Breakfast & Gym + Water
cron.schedule(
  "0 8 * * *",
  async () => {
    try {
      await sendBreakfastReminders("cron");
    } catch (err) {
      console.error("Cron Error:", err);
    }
  },
  { scheduled: true, timezone: "Asia/Kolkata" },
);

// 2. AFTERNOON (12:00 PM IST) - Lunch + Water
cron.schedule(
  "0 12 * * *",
  async () => {
    try {
      await sendLunchReminders("cron");
    } catch (err) {
      console.error("Cron Error:", err);
    }
  },
  { scheduled: true, timezone: "Asia/Kolkata" },
);

const processActiveSlotWindows = async (source = "window-check") => {
  if (isWithinBreakfastWindowIST()) {
    await sendBreakfastReminders(source);
  }
  if (isWithinLunchWindowIST()) {
    await sendLunchReminders(source);
  }
  if (isWithinEveningWindowIST()) {
    await sendEveningReminders(source);
  }
  if (isWithinNightWindowIST()) {
    await sendNightReminders(source);
  }
};

// Startup catch-up: send for active windows immediately.
(async () => {
  try {
    await processActiveSlotWindows("startup-window");
  } catch (err) {
    console.error("Startup Slot Window Error:", err);
  }
})();

// Window check every 5 minutes: if backend is running during the slot window,
// reminders are still sent once (guarded) even if exact minute cron was missed.
cron.schedule(
  "*/5 * * * *",
  async () => {
    try {
      await processActiveSlotWindows("window-check");
    } catch (err) {
      console.error("Window Check Error:", err);
    }
  },
  { scheduled: true, timezone: "Asia/Kolkata" },
);

// 3. EVENING (5:00 PM IST) - Snack & Gym Check + Water
cron.schedule(
  "0 17 * * *",
  async () => {
    try {
      await sendEveningReminders("cron");
    } catch (err) {
      console.error("Cron Error:", err);
    }
  },
  { scheduled: true, timezone: "Asia/Kolkata" },
);

// 4. NIGHT (8:00 PM IST) - Dinner + Water
cron.schedule(
  "0 20 * * *",
  async () => {
    try {
      await sendNightReminders("cron");
    } catch (err) {
      console.error("Cron Error:", err);
    }
  },
  { scheduled: true, timezone: "Asia/Kolkata" },
);

// 5. BEDTIME (10:00 PM IST) - Sleep
cron.schedule(
  "0 22 * * *",
  async () => {
    try {
      const users = await getUsersWithWhatsapp();

      for (const user of users) {
        if (hasAlreadySentForSlot(user.id, "sleep")) continue;

        const plan = await getDailyPlanForUser(user.id, getTodayName());
        const msg = `Time to wind down.\n\nYour AI plan recommends at least ${plan.sleep} tonight to recover properly.\n\nPut the phone away and get some rest. See you tomorrow!`;
        await twilioClient.messages.create({
          from: "whatsapp:+14155238886",
          to: `whatsapp:${user.whatsapp_number}`,
          body: msg,
        });
      }
    } catch (err) {
      console.error("Cron Error:", err);
    }
  },
  { scheduled: true, timezone: "Asia/Kolkata" }
);


// Route 1: Send OTP to Email
app.post("/forgot-password/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Security: Check if user exists (silently - don't reveal)
    const userResult = await db.query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);

    // Always return success message to prevent email enumeration
    // This prevents attackers from discovering registered emails
    if (userResult.rows.length === 0) {
      // Email not registered, but we don't tell the user
      return res.json({
        message:
          "If this email is registered with us, you'll receive an OTP shortly. Please check your inbox and spam folder.",
      });
    }

    // Email exists - proceed with OTP
    const userId = userResult.rows[0].id;
    const otp = generateOTP();

    // Delete old OTP if exists
    await db.query("DELETE FROM password_reset_otp WHERE user_id = $1", [userId]);

    // Store OTP in database with user_id
    await db.query(
      "INSERT INTO password_reset_otp (user_id, otp, expires_at) VALUES ($1, $2, NOW() + INTERVAL '10 minutes')",
      [userId, otp],
    );

    // Send OTP via email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "BeFit Password Reset OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4824ea;">Password Reset Request</h2>
          <p>Hello,</p>
          <p>You requested to reset your BeFit password. Here's your OTP:</p>
          <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="color: #4824ea; letter-spacing: 5px; margin: 0;">${otp}</h1>
          </div>
          <p><strong>This OTP is valid for 10 minutes.</strong></p>
          <p>If you didn't request this, please ignore this email.</p>
          <p>Best regards,<br/>BeFit Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({
      message:
        "If this email is registered with us, you'll receive an OTP shortly. Please check your inbox and spam folder.",
    });
  } catch (error) {
    console.error("Send OTP Error:", error);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

// Route 2: Verify OTP
app.post("/forgot-password/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    // Get user_id from email
    const userResult = await db.query("SELECT id FROM users WHERE email = $1", [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }
    const userId = userResult.rows[0].id;

    // Check if OTP exists and is not expired
    const otpResult = await db.query(
      "SELECT * FROM password_reset_otp WHERE user_id = $1 AND otp = $2 AND expires_at > NOW()",
      [userId, otp],
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Mark OTP as verified
    await db.query(
      "UPDATE password_reset_otp SET is_verified = TRUE WHERE user_id = $1 AND otp = $2",
      [userId, otp],
    );

    res.json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ message: "Failed to verify OTP" });
  }
});

// Route 3: Reset Password
app.post("/forgot-password/reset-password", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Check if user exists
    const userResult = await db.query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }
    const userId = userResult.rows[0].id;

    // Check if OTP was verified
    const otpResult = await db.query(
      "SELECT * FROM password_reset_otp WHERE user_id = $1 AND is_verified = TRUE AND expires_at > NOW()",
      [userId],
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({
        message: "OTP not verified or expired. Please request a new OTP.",
      });
    }

    // Hash new password
    bcrypt.hash(password, saltRounds, async (err, hash) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to reset password" });
      }

      try {
        // Update password in database
        await db.query("UPDATE users SET password = $1 WHERE email = $2", [
          hash,
          email,
        ]);

        // Delete used OTP
        await db.query("DELETE FROM password_reset_otp WHERE user_id = $1", [
          userId,
        ]);

        // Send confirmation email
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: "BeFit Password Changed Successfully",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4824ea;">Password Changed Successfully</h2>
              <p>Hello,</p>
              <p>Your BeFit password has been successfully changed.</p>
              <p>If you didn't make this change, please contact our support team immediately.</p>
              <p>Best regards,<br/>BeFit Team</p>
            </div>
          `,
        };

        await transporter.sendMail(mailOptions);

        res.json({ message: "Password reset successfully" });
      } catch (error) {
        console.error("Password Update Error:", error);
        res.status(500).json({ message: "Failed to reset password" });
      }
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Failed to reset password" });
  }
});
// GET completions for a user
app.get("/get-completions", async (req, res) => {
  if (!req.isAuthenticated())
    return res.status(401).json({ message: "Unauthorized" });
  try {
    const result = await db.query(
      "SELECT task_id, day FROM task_completions WHERE user_id=$1",
      [req.user.id],
    );
    res.json({ completions: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch completions" });
  }
});

app.post("/toggle-task", async (req, res) => {
  if (!req.isAuthenticated())
    return res.status(401).json({ message: "Unauthorized" });
  try {
    const { taskId, completed } = req.body;
    const userId = req.user.id;

    if (taskId.startsWith("diet-")) {
      const id = taskId.replace("diet-", "");
      await db.query(
        "UPDATE diet SET completed=$1 WHERE id=$2 AND user_id=$3",
        [completed, id, userId],
      );
    } else if (taskId.startsWith("ex-")) {
      const id = taskId.replace("ex-", "");
      await db.query(
        "UPDATE exercise SET completed=$1 WHERE id=$2 AND user_id=$3",
        [completed, id, userId],
      );
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to toggle task" });
  }
});

// TOGGLE a completion
app.post("/toggle-completion", async (req, res) => {
  if (!req.isAuthenticated())
    return res.status(401).json({ message: "Unauthorized" });
  try {
    const { taskId, day, completed } = req.body;
    const userId = req.user.id;
    if (completed) {
      await db.query(
        "INSERT INTO task_completions (user_id, task_id, day) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING",
        [userId, taskId, day],
      );
    } else {
      await db.query(
        "DELETE FROM task_completions WHERE user_id=$1 AND task_id=$2 AND day=$3",
        [userId, taskId, day],
      );
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to toggle completion" });
  }
});

// GET /profile — fetch all fields including email, phone, dob
app.get("/profile", async (req, res) => {
  if (!req.isAuthenticated())
    return res.status(401).json({ message: "Unauthorized" });

  try {
    const result = await db.query(
      "SELECT name, email, whatsapp_number, dob, sex, food, cstate FROM users WHERE id = $1",
      [req.user.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: "User not found" });

    const { name, email, whatsapp_number, dob, sex, food, cstate } = result.rows[0];
    res.json({
      name: name || "",
      email: email || "",
      phone: whatsapp_number || "",
      dob: dob ? dob.toISOString().split("T")[0] : "",
      gender: sex || null,
      diet_preference: food || null,
      state: cstate || "",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

// POST  handles all 7 editable fields
app.post("/profile/update", async (req, res) => {
  if (!req.isAuthenticated())
    return res.status(401).json({ message: "Unauthorized" });

  const userId = req.user.id;
  const { name, email, phone, dob, sex, food, cstate } = req.body;

  const fields = [];
  const values = [];
  let i = 1;

  if (name  !== undefined && name.trim()  !== "") { fields.push(`name = $${i++}`);             values.push(name.trim()); }
  if (email !== undefined && email.trim() !== "") { fields.push(`email = $${i++}`);            values.push(email.trim()); }
  if (phone !== undefined && phone.trim() !== "") { fields.push(`whatsapp_number = $${i++}`);  values.push(phone.trim()); }
  if (dob   !== undefined && dob.trim()   !== "") { fields.push(`dob = $${i++}`);              values.push(dob.trim()); }
  if (sex   !== undefined)                        { fields.push(`sex = $${i++}`);              values.push(sex); }
  if (food  !== undefined)                        { fields.push(`food = $${i++}`);             values.push(food); }
  if (cstate !== undefined)                       { fields.push(`cstate = $${i++}`);           values.push(cstate); }

  if (fields.length === 0)
    return res.status(400).json({ message: "No fields to update" });

  try {
    values.push(userId);
    await db.query(`UPDATE users SET ${fields.join(", ")} WHERE id = $${i}`, values);

    const fresh = await db.query("SELECT * FROM users WHERE id = $1", [userId]);
    await new Promise((resolve, reject) => {
      req.login(fresh.rows[0], (err) => (err ? reject(err) : resolve()));
    });

    res.json({ message: "Profile updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

app.post("/toggle-water-sleep", async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
  try {
    const { type, id, completed } = req.body;
    const userId = req.user.id;

    if (type === "water") {
      await db.query(
        "UPDATE water SET completed=$1 WHERE id=$2 AND user_id=$3",
        [completed, id, userId]
      );
    } else if (type === "sleep") {
      await db.query(
        "UPDATE sleep SET completed=$1 WHERE id=$2 AND user_id=$3",
        [completed, id, userId]
      );
    } else {
      return res.status(400).json({ message: "Invalid type" });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to toggle water/sleep" });
  }
});



app.listen(port, () => {
  console.log(`Your app is listening to port ${port}`);
});
