import express from "express";
import pg from "pg";
import bcrypt from "bcrypt";

let port = 5000;
const saltRounds = 10;

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
          await db.query(
            "INSERT INTO users (name, email, password, dob) VALUES ($1, $2, $3, $4)",
            [name, email, hash, dob],
          );
          res.render("login");
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

app.post("/login", async (req, res) => {
  try {
    let email = req.body.email;
    let password = req.body.password;
    let result = await db.query("select password from users where email=$1", [
      email,
    ]);
    if (result.rows.length > 0) {
      let user_password = result.rows[0].password;
      bcrypt.compare(password, user_password, (err, valid) => {
        if (err) {
          console.error(err);
          res.render("login", { error: "An error occurred during login" });
        } else {
          if (valid) {
            res.render("home");
          } else {
            res.render("login", { error: "Email or password is incorrect" });
          }
        }
      });
    } else {
      res.render("login", { error: "Email or password is incorrect" });
    }
  } catch (err) {
    res.render("login", { error: "Email or password is incorrect" });
  }
});

app.listen(port, () => {
  console.log(`Your app is listening to port ${port}`);
});
