import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import multer from "multer";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

let port = 5000;

let app = express();
app.use(express.urlencoded({ extended: true }));

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "befit",
  password: "",
  port: 5432,
});
db.connect();

dotenv.config();

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



app.post("/analyze/:id", async (req, res) => {
  
const userDetails = `
Age: ${req.body.age}
Gender: ${req.body.gender}
Height: ${req.body.height}
Weight: ${req.body.weight}
Medications: ${req.body.medicines}
`;

const result = await model.generateContent(
  BLOOD_PROMPT + "\n\nUser Info:\n" + userDetails + "\n\nReport:\n" + reportText
);
// this extracts the actual text output from AI
const aiResponse = result.response.text();
   // Convert string JSON to real JSON
    lastAnalysisResult = JSON.parse(aiResponse);

    res.json(lastAnalysisResult);

  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
 app.get("/analysis/:id", (req, res) => {
  if (!lastAnalysisResult) {
    return res.status(404).json({ message: "No analysis found" });
  }

  res.json(lastAnalysisResult);
});








app.listen(port, () => {
  console.log(`Your app is listening to port ${port}`);
});
