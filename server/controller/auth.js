const mysql = require("mysql");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");

//sql connectin
const dp = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_port,
});

//login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).render("login", {
        message: "Please provide an email and password",
      });
    }

    dp.query(
      "SELECT * FROM users WHERE email = ?",
      [email],
      async (error, results) => {
        if (!results.length) {
          return res.render("login", {
            message: "Email or Password is incorrect",
          });
        }
        if (
          !results ||
          !(await bcrypt.compare(password, results[0].password))
        ) {
          res.status(401).render("login", {
            message: "Email or Password is incorrect",
          });
        } else {
          const id = results[0].id;

          const token = jwt.sign({ id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN,
          });

          //console.log("The token is: " + token);

          const cookieOptions = {
            expires: new Date(
              Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
            ),
            httpOnly: true,
          };

          res.cookie("jwt", token, cookieOptions);
          res.status(200).redirect("/");
        }
      }
    );
  } catch (error) {
    console.log(error);
  }
};

//register
exports.register = (req, res) => {
  //console.log(req.body);

  const { name, email, password, passwordConfirm, adress, phone } = req.body;

  if (!email || !password || !name || !adress || !phone) {
    return res.status(400).render("register", {
      message: "Please provide all the necessary info",
    });
  }

  dp.query(
    "SELECT email FROM users WHERE email = ?",
    [email],
    async (err, results) => {
      if (err) {
        console.log(err);
      }

      if (results.length > 0) {
        return res.render("register", {
          message: "That email is already in use",
        });
      } else if (password !== passwordConfirm) {
        return res.render("register", {
          message: "Passwords do not match",
        });
      }

      let hashedPassword = await bcrypt.hash(password, 8);
      // console.log(hashedPassword);

      dp.query(
        "INSERT INTO users SET ?",
        {
          name: name,
          email: email,
          password: hashedPassword,
          adress: adress,
          phone: phone,
        },
        (err, results) => {
          if (err) {
            console.log(err);
          } else {
            //console.log(results);
            return res.render("register", {
              message: "User registered",
            });
          }
        }
      );
    }
  );
};

//loged in check

exports.isLoggedIn = async (req, res, next) => {
  //console.log(req.cookies);
  if (req.cookies.jwt) {
    try {
      //1) verify the token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      //console.log(decoded);

      //2) Check if the user still exists
      dp.query(
        "SELECT * FROM users WHERE id = ?",
        [decoded.id],
        (error, result) => {
          //console.log(result);

          if (!result) {
            return next();
          }

          req.user = result[0];
          //console.log("user is");
          //console.log(req.user);
          return next();
        }
      );
    } catch (error) {
      console.log(error);
      return next();
    }
  } else {
    next();
  }
};
//logout
exports.logout = async (req, res) => {
  res.cookie("jwt", "logout", {
    expires: new Date(Date.now() + 2 * 1000),
    httpOnly: true,
  });

  req.session.destroy();
  res.status(200).redirect("/");
};
