// const mongodb = require("mongodb");

const Product = require("../models-mongo/product");
const path = require("path");

const deleteFile = require("../utils/file");

exports.getAllProductsAdmin = (req, res, next) => {
  Product.find({ userId: req.user._id })
    .populate("userId")
    .then((products) => {
      res.render(path.join("admin", "product-list"), {
        pageTitle: "My shop",
        path: "/admin/product-list",
        prods: products,
        isLoggedIn: req.session.isLoggedIn,
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
  const img = req.file;
  const userId = req.session.user._id;
  if (!img) {
    return res.status(422).render(path.join("admin", "edit-product"), {
      pageTitle: "Add products",
      path: "/admin/add-product",
      product: { title: title, price: price, description: description },
      error: "Image file is incorrect",
    });
  }
  const imgUrl = img.path;
  const product = new Product({
    title: title,
    price: price,
    description: description,
    imgUrl: imgUrl,
    userId: userId,
  });
  product
    .save()
    .then(() => res.redirect("/admin/product-list"))
    .catch((err) => next(err));
};

exports.getEditProduct = (req, res, next) => {
  Product.findById(req.params.productId)
    .then((product) => {
      if (!product) {
        throw new Error("Product not found");
      }
      res.render(path.join("admin", "edit-product"), {
        pageTitle: "Edit product",
        path: "/admin/edit-product",
        product: product,
        isLoggedIn: req.session.isLoggedIn,
      });
    })
    .catch((err) => next(err));
};

exports.postEditProduct = (req, res, next) => {
  const title = req.body.title;
  const price = req.body.price;
  const description = req.body.description;
  const image = req.file;

  Product.findById(req.params.productId)
    .then((product) => {
      if (!product) {
        throw new Error("Product not found");
      }
      if (product.userId.toString() !== req.user._id.toString()) {
        throw new Error("Unathorized user");
      }
      const oldImgUrl = product.imgUrl;
      product.title = title;
      product.price = price;
      product.description = description;
      if (image) {
        product.imgUrl = image.path;
        deleteFile(oldImgUrl);
      }
      return product.save().then((result) => {
        console.log("UPDATED");
        res.redirect("/admin/product-list");
      });
    })

    .catch((err) => next(err));
};

exports.deleteProduct = (req, res, next) => {
  let oldImgUrl;
  const prodId = req.params.productId;
  Product.findOne({ _id: prodId, userId: req.user._id })
    .then((product) => {
      if (!product) {
        throw new Error("Product not found");
      }
      oldImgUrl = product.imgUrl;
      return product.remove();
    })
    .then(() => {
      deleteFile(oldImgUrl);
      return res.status(200).json({messsage: 'Success'});
    })

    // Product.deleteOne({ _id: req.body.productId, userId: req.user._id })
    //   .then(() => {
    //     return res.redirect("/admin/product-list");
    //   })
    .catch((err) => {
      return res.status(500).json({messsage: 'Deleting product failed'});
    });
};
