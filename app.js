const path = require("path");

const express = require("express");

const session = require("express-session");
const flash = require("connect-flash");

const MongoDBStore = require("connect-mongodb-session")(session);
const mongoose = require("mongoose");

const bodyParser = require("body-parser");
const multer = require("multer");

const csrf = require("csurf");

const MONGODB_URI =
  "connection_string";

// const sequelize = require("./utils/database");

// const Product = require("./models-sequelize/product");
// const User = require("./models-sequelize/user");
// const Cart = require("./models-sequelize/cart");
// const CartItem = require("./models-sequelize/cartItem");
// const Order = require("./models-sequelize/order");
// const OrderItem = require("./models-sequelize/orderItem");

const User = require("./models-mongo/user");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const userRoutes = require("./routes/user");

const rootDir = require("./utils/path");

const errorsControllers = require("./controllers-mongo/errors");

const app = express();

const store = new MongoDBStore({ uri: MONGODB_URI, collection: "sessions" });

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname
    );
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const csrfProtection = csrf();

app.set("view engine", "pug");
app.set("views", "views");
app.use(express.static(path.join(rootDir, "public")));
app.use("/images", express.static(path.join(rootDir, "images")));

app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single("img"));
app.use(bodyParser.urlencoded({ extended: false }));

app.use(flash());

app.use(csrfProtection);

app.use((req, res, next) => {
  if (req.session.user) {
    User.findById(req.session.user._id)
      .then((user) => {
        if (!user) {
          return next();
        }
        req.user = user;
        next();
      })
      .catch((err) => next(err));
  } else {
    next();
  }
});

app.use((req, res, next) => {
  res.locals.isLoggedIn = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(userRoutes);

app.use(errorsControllers.error404);

app.use((error, req, res, next) => {
  console.log(error);
  res.status(500).render("500", {
    pageTitle: "Unknown error",
  });
});

// Product.belongsTo(User, { constraints: true, onDelete: "CASCADE" });
// User.hasMany(Product);

// User.hasOne(Cart);
// Cart.belongsTo(User, { constraints: true, onDelete: "CASCADE" });

// Cart.belongsToMany(Product, { through: CartItem });
// Product.belongsToMany(Cart, { through: CartItem });

// User.hasMany(Order);
// Order.belongsTo(User, { constraints: true, onDelete: "CASCADE" });
// Order.belongsToMany(Product, { through: OrderItem });
// Product.belongsToMany(Order, { through: OrderItem });

// sequelize
//   // if it is needed to delete and create new tables, force: true
//   // .sync({ force: true })
//   .sync()
//   .then((res) => User.findByPk(1))
//   .then((user) => {
//     if (!user) {
//       return User.create({ name: "Elena", email: "test@test.ru" });
//     }
//     return Promise.resolve(user);
//   })
//   .then((user) => {
//     app.listen(3000);
//   })
//   .catch((err) => next(err));

// mongoConnect(() => {
//   app.listen(3000);
// });

mongoose
  .connect(MONGODB_URI)
  .then((res) => {
    app.listen(3000);
  })
  .catch((err) => console.log(err));
