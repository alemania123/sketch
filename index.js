var express = require("express");
var bodyParser = require("body-parser");
const mysql = require("mysql");
var app = express();
const path = require("path");
var cookieParser = require("cookie-parser");
var session = require("express-session");

app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());
app.set("view engine", "ejs");

app.use(cookieParser());
app.use(
  session({
    secret: "Shh, its a secret!",
    saveUninitialized: true,
    resave: false,
  })
);
app.use(express.static(path.join(__dirname, "/public")));

//from line 25 - 35 mysql database
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "sketch2",
});

db.connect((err) => {
  if (err) throw err;
  console.log("Connected to db");
});

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/admin", (req, res) => {
  if (req.session.userid != null) {
    db.query(
      "SELECT * FROM user WHERE username='" + req.session.userid + "'",
      (err, users) => {
        if (err) throw err;

        db.query("SELECT * FROM items", (err1, items) => {
          res.render("admin", { user: users, items: items });
        });
      }
    );
  } else {
    res.redirect("/signin");
  }
});

app.all("/signin", (req, res) => {
  if (req.method == "POST") {
    var params = req.body;

    db.query(
      `SELECT * FROM user WHERE username = "${params.username}" AND password = "${params.password}"`,
      (err, result) => {
        if (err) throw err;
        console.log(result[0]);
        if (result.length != 0) {
          if (result[0].role == "admin") {
            var session = req.session;
            session.userid = params.username;
            res.redirect("/admin");
          } else {
            var session = req.session;
            session.userid = params.username;
            res.redirect("/guest");
          }
        } else {
          res.redirect("/signin");
        }
      }
    );
  } else {
    res.render("login");
  }
});

app.all("/signup", (req, res) => {
  if (req.method == "POST") {
    var params = req.body;

    db.query("INSERT INTO user SET ?", params, (err, results) => {
      //'INSERT INTO applicationform SET ?'
      if (err) throw err;

      var session = req.session;

      session.userid = params.username;

      res.redirect("/guest");
    });
  } else {
    res.render("signup");
  }
});

app.get("/guest", (req, res) => {
  if (req.session.userid != null) {
    db.query(
      "SELECT * FROM user WHERE username = '" + req.session.userid + "'",
      (err, result) => {
        if (err) throw err;
        res.render("guest", { data: result });
      }
    );
  } else {
    res.redirect("/signin");
  }
});

app.all("/update/:id", (req, res) => {
  const id = req.params.id;
  if (req.method == "POST") {
    const params = req.body;

    db.query(
      `UPDATE items SET item_name='${params.update_item_name}', item_cat = '${params.update_item_cat}', item_price = '${params.update_item_price}',  item_quantity = '${params.update_item_quantity}',  item_picture = '${params.update_item_picture}' WHERE item_id = ${params.update_item_id} `,
      (err, result) => {
        if (err) throw err;
        res.redirect("/admin");
      }
    );
  } else {
    db.query("SELECT * FROM items WHERE item_id =" + id, (err, result) => {
      if (err) throw err;
      res.render("update", { data: result[0] });
    });
  }
});

app.all("/itemsforsale", (req, res) => {
  db.query("SELECT * FROM items", (err1, items) => {
    res.render("itemsforsale", { items: items });
  });
});

app.post("/delete", (req, res) => {
  const id = req.body.id;

  db.query("DELETE FROM items WHERE item_id=" + id, (err, result) => {
    if (err) throw err;
    res.redirect("/admin");
  });
});

app.all("/additem", (req, res) => {
  if (req.method == "POST") {
    const params = req.body;

    db.query("INSERT INTO items SET ?", params, (err, result) => {
      if (err) throw err;

      res.redirect("/admin");
    });
  } else {
    res.render("additem");
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy();

  res.redirect("/admin");
});

app.all("/contactinfo", (req, res) => {
  res.render("contactinfo");
});

app.all("/techstack", (req, res) => {
  res.render("techstack");
});

app.listen(process.env.PORT || 3000);
console.log("app is running");
