const express = require("express");

// const adminControllers = require("../controllers-sequelize/admin");
const adminControllers = require("../controllers-mongo/admin");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

router.get("/product-list", isAuth, adminControllers.getAllProductsAdmin);

router.get("/add-product", isAuth, adminControllers.getAddProduct);
router.post("/add-product", isAuth, adminControllers.postAddProduct);

router.get("/edit-product/:productId", isAuth, adminControllers.getEditProduct);
router.post(
  "/edit-product/:productId",
  isAuth,
  adminControllers.postEditProduct
);

router.delete(
  "/delete-product/:productId",
  isAuth,
  adminControllers.deleteProduct
);

module.exports = router;
