const express = require("express");
const router = express.Router();
const productController = require("../controller/productController");
const authController = require("../controller/auth");
const mysql = require("mysql");

//create, find,  update, delete, view
router.get("/", authController.isLoggedIn, (req, res) => {
  res.render("hom", {
    user: req.user,
  });
});
//shop page
router.get("/shop", authController.isLoggedIn, productController.view);
//search
router.post("/shop", authController.isLoggedIn, productController.find);
//admine
router.get(
  "/admin-product",
  authController.isLoggedIn,
  productController.admine
);
//add product fu
router.post("/addpro", authController.isLoggedIn, productController.pcreate);
//add product page
router.get("/addpro", authController.isLoggedIn, productController.pform);
//edit product page
router.get("/editpro/:id", authController.isLoggedIn, productController.eform);
//edit product
router.post("/editpro/:id", productController.eproduct);
//delete
router.get("/delete/:id", productController.delete);
//view single
router.get("/view/:id", authController.isLoggedIn, productController.views);

//register and login

router.get("/register", (req, res) => {
  res.render("register");
});

router.get("/login", (req, res) => {
  res.render("login");
});
//profile
router.get("/profile", authController.isLoggedIn, (req, res) => {
  //console.log(req.user);
  if (req.user) {
    res.render("profile", {
      user: req.user,
    });
  } else {
    res.redirect("/login");
  }
});

//cart

function isProductInCart(cart, id) {
  for (let i = 0; i < cart.length; i++) {
    if (cart[i].id == id) {
      return true;
    }
  }
  return false;
}

function calculateTotal(cart, req) {
  total = 0;
  for (let i = 0; i < cart.length; i++) {
    total = total + cart[i].price * cart[i].quantity;
  }
  req.session.total = total;
  return total;
}

//add to cart
router.post("/add_to_cart", function (req, res) {
  var id = req.body.id;
  var title = req.body.title;
  var price = req.body.price;
  var img = req.body.img;
  var quantity = req.body.quantity;
  var product = {
    id: id,
    title: title,
    price: price,
    img: img,
    quantity: quantity,
  };
  if (req.session.cart) {
    var cart = req.session.cart;

    if (!isProductInCart(cart, id)) {
      cart.push(product);
    }
  } else {
    req.session.cart = [product];
    var cart = req.session.cart;
  }

  //calculate total
  calculateTotal(cart, req);
  //return to cart page
  res.redirect("/cart");
});
//cart page
router.get("/cart", authController.isLoggedIn, function (req, res) {
  var cart = req.session.cart;
  var total = req.session.total;

  res.render("cart", { cart: cart, total: total, user: req.user });
});

//remove_cart
router.post("/remove_cart", function (req, res) {
  var id = req.body.id;
  var cart = req.session.cart;

  for (let i = 0; i < cart.length; i++) {
    if (cart[i].id == id) {
      cart.splice(cart.indexOf(i), 1);
    }
  }
  //re-calculate
  calculateTotal(cart, req);
  res.redirect("/cart");
});

//Checkout

//sql connectin
const dp = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_port,
});

router.get("/checkout", authController.isLoggedIn, function (req, res) {
  var total = req.session.total;
  res.render("checkout", { user: req.user, total });
  req.session.destroy();
});

//make order
router.post("/pace_order", function (req, res) {
  var name = req.body.name;
  var cost = req.body.cost;
  var email = req.body.email;
  var adress = req.body.adress;
  var phone = req.body.phone;
  var products_ids = "";
  var date = new Date();
  var cart = req.session.cart;
  var pquantity = "";

  for (let i = 0; i < cart.length; i++) {
    products_ids = products_ids + "," + cart[i].id;
  }

  for (let i = 0; i < cart.length; i++) {
    pquantity = pquantity + "," + cart[i].quantity;
  }

  var quer =
    "INSERT INTO orders  (cost,name,email,adress,phone,products_ids,date,pquantity) VALUES ?";
  var values = [
    [cost, name, email, adress, phone, products_ids, date, pquantity],
  ];
  dp.query(quer, [values], (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/checkout");
    }
  });
});
//orders p
router.get("/orders", authController.isLoggedIn, function (req, res) {
  dp.query("SELECT * FROM orders", (err, rows) => {
    if (!err) {
      res.render("orders", { rows, user: req.user });
    } else {
      console.log(err);
    }
  });
});

//edit user p
router.get("/edit_user/:id", authController.isLoggedIn, function (req, res) {
  dp.query(
    "SELECT * FROM users WHERE `id` = ?",
    [req.params.id],
    (err, rows) => {
      if (!err) {
        res.render("edit-user", { rows, user: req.user });
      } else {
        console.log(err);
      }
    }
  );
});
router.post("/edit_user/:id", authController.isLoggedIn, function (req, res) {
  const { u_adress, u_phone } = req.body;

  dp.query(
    "UPDATE users SET `adress` = ?, `phone` = ? WHERE `id` = ?",
    [u_adress, u_phone, req.params.id],
    (err, rows) => {
      if (!err) {
        res.redirect("/profile");
      } else {
        console.log(err);
      }
    }
  );
});

module.exports = router;
