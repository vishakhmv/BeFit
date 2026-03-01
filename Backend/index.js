import express from "express";
import pg from "pg";
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";

let port = 5000;
const saltRounds = 10;

let app = express();
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "",
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
          res.status(500).send("Signup failed");
        } else {
          const insertResult = await db.query(
            "INSERT INTO users (name, email, password, dob) VALUES ($1, $2, $3, $4) RETURNING *",
            [name, email, hash, dob],
          );

          const user = insertResult.rows[0];

          req.login(user, (err) => {
            if (err) {
              console.log(err);
              res.redirect("/login");
            } else {
              res.render("home");
            }
          });
        }
      });
    } else {
      res.render("signup", { error: "Email already exist" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Signup failed");
  }
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/home",
    failureRedirect: "/login",
  }),
);

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

passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((user, cb) => {
  cb(null, user);
});

app.listen(port, () => {
  console.log(`Your app is listening to port ${port}`);
});
