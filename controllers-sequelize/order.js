const path = require("path");
const Product = require("../models-sequelize/product");

exports.getCart = (req, res, next) => {
  req.session.user
    .getCart()
    .then((cart) => {
      if (!cart) {
        return req.session.user.createCart();
      }
      return Promise.resolve(cart);
    })
    .then((cart) => {
      return cart.getProducts();
    })
    .then((products) => {
      res.render(path.join("shop", "cart"), {
        pageTitle: "cart",
        path: "/cart",
        prods: products,
        totalPrice: 0,
      });
    })
    .catch((err) => next(err));
};

exports.postCart = (req, res, next) => {
  let fetchedCart;
  let newQuantity = 1;
  req.session.user
    .getCart()
    .then((cart) => {
      if (!cart) {
        return req.session.user.createCart();
      }
      return Promise.resolve(cart);
    })
    .then((cart) => {
      fetchedCart = cart;

      return cart.getProducts({ where: { id: req.body.productId } });
    })
    .then(([product]) => {
      if (!product) {
        return Product.findByPk(req.body.productId);
      } else {
        const oldQuantity = product.cartItem.quantity;
        newQuantity = oldQuantity + 1;
        return Promise.resolve(product);
      }
    })
    .then((product) => {
      return fetchedCart.addProduct(product, {
        through: { quantity: newQuantity },
      });
    })
    .then((result) => res.redirect("/cart"))
    .catch((err) => next(err));
};

exports.postCartDeleteItem = (req, res, next) => {
  let fetchedCart;
  req.session.user
    .getCart()
    .then((cart) => {
      fetchedCart = cart;
      return cart.getProducts({ where: { id: req.body.productId } });
    })
    .then(([product]) => {
      return product.cartItem.destroy();
    })
    .then(() => res.redirect("/cart"))
    .catch((err) => next(err));
};

exports.postCartReduceItem = (req, res, next) => {
  let fetchedCart;
  req.session.user
    .getCart()
    .then((cart) => {
      fetchedCart = cart;
      return cart.getProducts({ where: { id: req.body.productId } });
    })
    .then(([product]) => {
      if (product.cartItem.quantity === 1) {
        return product.cartItem.destroy();
      } else {
        const newQuantity = product.cartItem.quantity - 1;
        return fetchedCart.addProduct(product, {
          through: { quantity: newQuantity },
        });
      }
    })
    .then(() => res.redirect("/cart"))
    .catch((err) => next(err));
};

exports.postCheckout = (req, res, next) => {
  let newOrder;
  let fetchedCart;
  req.session.user
    .createOrder()
    .then((order) => {
      newOrder = order;
      return req.session.user.getCart();
    })
    .then((cart) => {
      fetchedCart = cart;
      return cart.getProducts();
    })
    .then((products) => {
      newOrder.addProducts(
        products.map((prod) => {
          prod.orderItem = { quantity: prod.cartItem.quantity };
          return prod;
        })
      );
    })
    .then(() => fetchedCart.setProducts(null))
    .then(() => res.redirect("/"))
    .catch((err) => next(err));
};

exports.getOrders = (req, res, next) => {
  req.session.user
    .getOrders({ include: ["products"] })
    .then((orders) => {
      res.render(path.join("shop", "orders"), {
        pageTitle: "Orders",
        path: "/orders",
        orders: orders,
      });
    })
    .catch((err) => next(err));
};
