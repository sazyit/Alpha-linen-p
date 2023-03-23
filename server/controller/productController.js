const mysql = require("mysql");

//sql connectin
const dp = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_port,
});

//view product
exports.view = (req, res) => {
  dp.query("SELECT * FROM products", (err, rows) => {
    if (!err) {
      res.render("shop", { rows, user: req.user });
    } else {
      console.log(err);
    }
  });
};

//find product
exports.find = (req, res) => {
  let searchTerm = req.body.search;
  dp.query(
    "SELECT * FROM products WHERE title LIKE ?",
    ["%" + searchTerm + "%"],
    (err, rows) => {
      if (!err) {
        res.render("shop", { rows, user: req.user });
      } else {
        console.log(err);
      }
    }
  );
};

//admine-page
exports.admine = (req, res) => {
  dp.query(
    "SELECT * FROM products WHERE `shop_name` = ?",
    [req.user.name],
    (err, rows) => {
      if (!err) {
        res.render("admin-product", { rows, user: req.user });
      } else {
        console.log(err);
      }
    }
  );
};

//open new product page
exports.pform = (req, res) => {
  res.render("add-product", { user: req.user });
};

//add new product
exports.pcreate = (req, res) => {
  const { p_title, p_desc, p_img, p_shop, p_price } = req.body;

  dp.query(
    "INSERT INTO products SET `title` = ?, `desc` = ?, `img` = ?,  `price` = ?,`shop_name` = ?",
    [p_title, p_desc, p_img, p_price, p_shop],
    (err, rows) => {
      if (!err) {
        res.render("add-product", {
          user: req.user,
          alert: "product have been added",
        });
      } else {
        console.log(err);
      }
    }
  );
};

//edit product
//or view bordic page??
exports.eform = (req, res) => {
  dp.query(
    "SELECT * FROM products WHERE `id` = ?",
    [req.params.id],
    (err, rows) => {
      if (!err) {
        res.render("edit-product", { rows, user: req.user });
      } else {
        console.log(err);
      }
    }
  );
};

//edit product
exports.eproduct = (req, res) => {
  const { p_title, p_desc, p_img, p_price } = req.body;

  dp.query(
    "UPDATE products SET `title` = ?, `desc` = ?, `img` = ? , `price` = ? WHERE `id` = ?",
    [p_title, p_desc, p_img, p_price, req.params.id],
    (err, rows) => {
      if (!err) {
        res.redirect("/admin-product");
      } else {
        console.log(err);
      }
    }
  );
};

// delete
exports.delete = (req, res) => {
  dp.query(
    "DELETE FROM products WHERE `id` = ?",
    [req.params.id],
    (err, rows) => {
      if (!err) {
        res.redirect("/admin-product");
      } else {
        console.log(err);
      }
    }
  );
};

//view single
exports.views = (req, res) => {
  dp.query(
    "SELECT * FROM products WHERE `id` = ?",
    [req.params.id],
    (err, rows) => {
      if (!err) {
        res.render("product", { rows, user: req.user });
      } else {
        console.log(err);
      }
    }
  );
};
