const express = require("express");
const exphbs = require("express-handlebars");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo");
var path = require("path");

require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(
  session({
    secret: "musuprefdjd",
    store: MongoStore.create({
      mongoUrl: process.env.MOGO_url,
    }),
    saveUninitialized: false,
    resave: false,
  })
);

//Static Files
app.use(express.static(path.join(__dirname, "/public")));

//handlebars seting
const handlebars = exphbs.create({ extname: ".hbs" });
app.engine(".hbs", handlebars.engine);
app.set("view engine", "hbs");

//sql connectin
const dp = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_port,
});

dp.connect((err) => {
  if (err) {
    console.log(err);
  } else {
    console.log("Connected to Database");
  }
});

//routes
const routes = require("./server/routes/product");
app.use("/", routes);

app.use("/auth", require("./server/routes/auth"));

//server
app.listen(port, () => console.log(`Servier is runung on port ${port}`));
