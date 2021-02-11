const express = require("express");
// const shopControllers = require("../controllers-sequelize/shop");
// const orderControllers = require("../controllers-sequelize/order");
const shopControllers = require("../controllers-mongo/shop");
const orderControllers = require("../controllers-mongo/order");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

router.get("/", shopControllers.getIndex);

router.get("/product-list", shopControllers.getAllProducts);

router.get("/product-list/:productId", shopControllers.getProduct);

router.get("/cart", isAuth, orderControllers.getCart);
router.post("/cart", isAuth, orderControllers.postCart);
router.post(
  "/cart/delete-product",
  isAuth,
  orderControllers.postCartDeleteItem
);
router.post(
  "/cart/reduce-product-quantity",
  isAuth,
  orderControllers.postCartReduceItem
);

router.post("/cart/checkout", isAuth, orderControllers.postCheckout);

router.get("/orders", isAuth, orderControllers.getOrders);

router.get("/orders/:orderId", isAuth, orderControllers.getInvoice);

module.exports = router;
