const Product = require("../models-sequelize/product");
const path = require("path");

exports.getAllProductsAdmin = (req, res, next) => {
  req.session.user
    .getProducts()
    .then((products) => {
      res.render(path.join("admin", "product-list"), {
        pageTitle: "My shop",
        path: "/admin/product-list",
        prods: products,
      });
    })
    .catch((err) => next(err));
};

exports.getAddProduct = (req, res, next) => {
  res.render(path.join("admin", "edit-product"), {
    pageTitle: "Add products",
    path: "/admin/add-product",
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const price = req.body.price;
  const description = req.body.description;
  const imgUrl = req.body.imgUrl;
  req.session.user
    .createProduct({
      title: title,
      price: price,
      description: description,
      imgUrl: imgUrl,
    })
    .then((prod) => res.redirect("/admin/product-list"))
    .catch((err) => next(err));
};

exports.getEditProduct = (req, res, next) => {
  req.session.user
    .getProducts({ where: { id: req.params.productId } })
    .then(([product]) => {
      if (!product) {
        return res.redirect("/");
      }
      res.render(path.join("admin", "edit-product"), {
        pageTitle: "Edit product",
        path: "/admin/edit-product",
        product: product,
      });
    });
};

exports.postEditProduct = (req, res, next) => {
  Product.findByPk(req.params.productId)
    .then((product) => {
      product.title = req.body.title;
      (product.price = req.body.price),
        (product.description = req.body.description);
      product.imgUrl = req.body.imgUrl;
      return product.save();
    })
    .then((result) => {
      console.log("UPDATED");
      res.redirect("/admin/product-list");
    })
    .catch((err) => next(err));
};

exports.getDeleteProduct = (req, res, next) => {
  req.session.user
    .getProducts({ where: { id: req.params.productId } })
    .then(([product]) => {
      if (!product) {
        res.redirect("/admin/product-list");
      }
      return product.destroy();
    })
    .then((result) => {
      console.log("Product deleted");
      res.redirect("/admin/product-list");
    })
    .catch((err) => next(err));
};
