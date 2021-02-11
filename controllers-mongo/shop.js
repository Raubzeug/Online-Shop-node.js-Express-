const Product = require("../models-mongo/product");
const path = require("path");

const ITEMS_PER_PAGE = 2;

exports.getIndex = (req, res, next) => {
  const page = req.query.page ? req.query.page : 1;
  console.log(page);
  let quantity;
  Product.countDocuments()
    .then((q) => {
      quantity = q;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render(path.join("shop", "index"), {
        pageTitle: "Index page",
        path: "/",
        prods: products,
        curPage: page,
        pages: Math.ceil(quantity / ITEMS_PER_PAGE),
      });
    })
    .catch((err) => next(err));
};

exports.getAllProducts = (req, res, next) => {
  const page = req.query.page ? req.query.page : 1;
  console.log(page);
  let quantity;
  Product.countDocuments()
    .then((q) => {
      quantity = q;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render(path.join("shop", "index"), {
        pageTitle: "My shop",
        path: "/product-list",
        prods: products,
        curPage: page,
        pages: Math.ceil(quantity / ITEMS_PER_PAGE),
      });
    })
    .catch((err) => next(err));
};

exports.getProduct = (req, res, next) => {
  Product.findById(req.params.productId).then((product) => {
    if (!product) {
      return res.status(404).render("404", { pageTitle: "Page not found" });
    }
    res.render(path.join("shop", "product-details"), {
      pageTitle: product.title,
      product: product,
      isLoggedIn: req.session.isLoggedIn,
    });
  });
};
