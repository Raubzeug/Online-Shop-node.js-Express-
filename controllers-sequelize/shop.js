const Product = require("../models-sequelize/product");
const path = require("path");

exports.getIndex = (req, res, next) => {
  Product.findAll()
    .then((products) => {
      res.render(path.join("shop", "index"), {
        pageTitle: "Index page",
        path: "/",
        prods: products,
      });
    })
    .catch((err) => next(err));
};

exports.getAllProducts = (req, res, next) => {
  Product.findAll()
    .then((products) => {
      res.render(path.join("shop", "product-list"), {
        pageTitle: "My shop",
        path: "/product-list",
        prods: products,
      });
    })
    .catch((err) => next(err));
};

exports.getProduct = (req, res, next) => {
  Product.findByPk(req.params.productId).then((product) => {
    if (!product) {
      return res.status(404).render("404", { pageTitle: "Page not found" });
    }
    res.render(path.join("shop", "product-details"), {
      pageTitle: product.title,
      product: product,
    });
  });
};
