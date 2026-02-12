import express from "express";
import bodyParser from "body-parser";
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

app.listen(port, () => {
  console.log(`Your app is listening to port ${port}`);
});
