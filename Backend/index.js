import express from "express";
import pg from "pg";
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";
import dotenv from "dotenv";
import cors from "cors";

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

app.listen(port, () => {
  console.log(`Your app is listening to port ${port}`);
});
