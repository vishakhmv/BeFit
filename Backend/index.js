import express from "express";
import bodyParser from "body-parser";
let port = 5000;

let app = express();
app.use(express.urlencoded({ extended: true }));

app.listen(port, () => {
  console.log(`Your app is listening to port ${port}`);
});
