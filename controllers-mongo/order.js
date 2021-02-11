const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const Product = require("../models-mongo/product");
const Order = require("../models-mongo/order");

exports.getCart = (req, res, next) => {
  req.user
    .getCart()
    .then((products) => {
      res.render(path.join("shop", "cart"), {
        pageTitle: "cart",
        path: "/cart",
        prods: products,
        totalPrice: 0,
        isLoggedIn: req.session.isLoggedIn,
      });
    })
    .catch((err) => next(err));
};

exports.postCart = (req, res, next) => {
  const productId = req.body.productId;
  Product.findById(productId).then((product) => {
    req.user
      .addToCart(product)
      .then((result) => {
        res.redirect("/cart");
      })
      .catch((err) => next(err));
  });
};

exports.postCartDeleteItem = (req, res, next) => {
  req.user
    .deleteFromCart(req.body.productId, true)
    .then(() => res.redirect("/cart"))
    .catch((err) => next(err));
};

exports.postCartReduceItem = (req, res, next) => {
  req.user
    .deleteFromCart(req.body.productId)
    .then(() => res.redirect("/cart"))
    .catch((err) => next(err));
};

exports.postCheckout = (req, res, next) => {
  req.user
    .addOrder()
    .then(() => res.redirect("/"))
    .catch((err) => next(err));
};

exports.getOrders = (req, res, next) => {
  Order.find({ "user.userId": req.session.user._id })
    .then((orders) => {
      res.render(path.join("shop", "orders"), {
        pageTitle: "Orders",
        path: "/orders",
        orders: orders,
        isLoggedIn: req.session.isLoggedIn,
      });
    })
    .catch((err) => next(err));
};

exports.getInvoice = (req, res, next) => {
  const pdfDoc = new PDFDocument();
  const invoiceId = req.params.orderId;
  const invoiceName = "invoice-" + invoiceId + ".pdf";
  const invoicePath = path.join("data", "invoices", invoiceName);
  Order.findById(invoiceId)
    .then((order) => {
      if (!order) {
        return next(new Error("no order found"));
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return res.redirect("/orders");
      }
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        'inline; filename="' + invoiceName + '"'
      );
      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);
      pdfDoc.fontSize(26).text("Invoice", { underline: true });
      pdfDoc.text("----------------------------");
      let totalPrice = 0;
      order.products.forEach((prod) => {
        pdfDoc
          .fontSize(14)
          .text(
            prod.productData.title +
              " - " +
              prod.quantity +
              " pcs. * $" +
              prod.productData.price
          );
        totalPrice += prod.productData.price * prod.quantity;
      });
      pdfDoc.text("----------------------------");
      pdfDoc.fontSize(20).text("TOTAL: $" + totalPrice);
      pdfDoc.end();

      // const file = fs.createReadStream(invoicePath);

      // file.pipe(res);
    })
    .catch((err) => next(err));
};
