import express from "express";
import pg from "pg";

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

app.post("/signup", async (req, res) => {
  try {
    let name = req.body.name;
    let email = req.body.email;
    let password = req.body.password;
    let dob = req.body.dob;
    await db.query(
      "INSERT INTO users (name, email, password, dob) VALUES ($1, $2, $3, $4)",
      [name, email, password, dob],
    );
    res.render("login");
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
      if (password === user_password) {
        res.render("home");
      } else {
        res.render("login", { error: "Email or password is incorrect" });
      }
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
