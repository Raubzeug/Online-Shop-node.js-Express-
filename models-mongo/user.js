const mongoose = require("mongoose");

const Product = require("./product");
const Order = require("./order");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  resetToken: String,
  resetTokenExpiration: Date,
  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true },
      },
    ],
  },
});

userSchema.methods.addToCart = function (product) {
  const updatedCartItems = [...this.cart.items];
  let newQuantity = 1;
  const existingProductIndex = this.cart.items.findIndex(
    (el) => el.productId.toString() === product._id.toString()
  );
  if (existingProductIndex != -1) {
    newQuantity = this.cart.items[existingProductIndex].quantity + 1;
    updatedCartItems[existingProductIndex].quantity = newQuantity;
  } else {
    updatedCartItems.push({ productId: product._id, quantity: newQuantity });
  }
  const updatedCart = { items: updatedCartItems };
  this.cart = updatedCart;
  return this.save();
};

userSchema.methods.getCart = function () {
  const productIds = this.cart.items.map((el) => {
    return el.productId;
  });
  return Product.find()
    .where("_id")
    .in(productIds)
    .then((products) => {
      if (products.length < productIds.length) {
        const updatedCartItems = [];
        for (let item of this.cart.items) {
          for (let updItem of products) {
            if (item.productId.toString() === updItem._id.toString()) {
              updatedCartItems.push(item);
              break;
            }
          }
        }
        const updatedCart = { items: updatedCartItems };
        this.cart = updatedCart;
        return this.save().then((res) => products);
      } else {
        return Promise.resolve(products);
      }
    })
    .then((products) => {
      const prodsWithQuantity = products.map((el) => {
        for (let prod of this.cart.items) {
          if (el._id.toString() === prod.productId.toString()) {
            el.quantity = prod.quantity;
            return el;
          }
        }
      });
      return prodsWithQuantity;
    })
    .catch((err) => next(err));
};

userSchema.methods.deleteFromCart = function (productId, toDelete = false) {
  const updatedCartItems = [...this.cart.items];
  const prodIndex = this.cart.items.findIndex(
    (el) => el.productId.toString() === productId.toString()
  );
  if (prodIndex != -1) {
    if (this.cart.items[prodIndex].quantity === 1 || toDelete) {
      updatedCartItems.splice(prodIndex, 1);
    } else {
      const updQuantity = this.cart.items[prodIndex].quantity - 1;
      updatedCartItems[prodIndex].quantity = updQuantity;
    }
  }
  const updatedCart = { items: updatedCartItems };
  this.cart = updatedCart;
  return this.save();
};

userSchema.methods.addOrder = function () {
  return this.populate("cart.items.productId")
    .execPopulate()
    .then((user) => {
      const products = user.cart.items.map((i) => {
        return { quantity: i.quantity, productData: { ...i.productId._doc } };
      });
      const order = new Order({
        user: { email: this.email, userId: this._id },
        products: products,
      });
      return order.save().then((res) => {
        this.cart = { items: [] };
        return this.save();
      });
    });
};

module.exports = mongoose.model("User", userSchema);

// const mongodb = require("mongodb");

// const { getDb } = require("../utils/database");

// class User {
//   constructor(username, email, id, cart) {
//     this.username = username;
//     this.email = email;
//     this._id = id ? new mongodb.ObjectId(id) : null;
//     this.cart = cart ? cart : { items: [] };
//   }

//   save() {
//     const db = getDb();
//     let dbOp;
//     if (this._id) {
//       dbOp = db
//         .collection("users")
//         .updateOne({ _id: this._id }, { $set: this });
//     } else {
//       dbOp = db.collection("users").insertOne(this);
//     }
//     return dbOp;
//   }

//   addToCart(product) {
//     const db = getDb();
//     const updatedCartItems = [...this.cart.items];
//     let newQuantity = 1;
//     const existingProductIndex = this.cart.items.findIndex(
//       (el) => el.productId.toString() === product._id.toString()
//     );
//     if (existingProductIndex != -1) {
//       newQuantity = this.cart.items[existingProductIndex].quantity + 1;
//       updatedCartItems[existingProductIndex].quantity = newQuantity;
//     } else {
//       updatedCartItems.push({ productId: product._id, quantity: newQuantity });
//     }
//     const updatedCart = { items: updatedCartItems };
//     return db
//       .collection("users")
//       .updateOne({ _id: this._id }, { $set: { cart: updatedCart } });
//   }

//   deleteFromCart(productId, toDelete = false) {
//     const db = getDb();
//     const updatedCartItems = [...this.cart.items];
//     const prodIndex = this.cart.items.findIndex(
//       (el) => el.productId.toString() === productId.toString()
//     );
//     if (prodIndex != -1) {
//       if (this.cart.items[prodIndex].quantity === 1 || toDelete) {
//         updatedCartItems.splice(prodIndex, 1);
//       } else {
//         const updQuantity = this.cart.items[prodIndex].quantity - 1;
//         updatedCartItems[prodIndex].quantity = updQuantity;
//       }
//     }
//     const updatedCart = { items: updatedCartItems };
//     return db
//       .collection("users")
//       .updateOne({ _id: this._id }, { $set: { cart: updatedCart } });
//   }

//   getCart() {
//     const db = getDb();
//     const productIds = this.cart.items.map((el) => {
//       return el.productId;
//     });
//     return db
//       .collection("products")
//       .find({ _id: { $in: productIds } })
//       .toArray()
//       .then((products) => {
//         if (products.length < productIds.length) {
//           const updatedCartItems = [];
//           for (let item of this.cart.items) {
//             for (let updItem of products) {
//               if (item.productId.toString() === updItem._id.toString()) {
//                 updatedCartItems.push(item);
//                 break;
//               }
//             }
//           }
//           const updatedCart = { items: updatedCartItems };
//           return db
//             .collection("users")
//             .updateOne({ _id: this._id }, { $set: { cart: updatedCart } })
//             .then((res) => products);
//         } else {
//           return Promise.resolve(products);
//         }
//       })
//       .then((products) => {
//         return products.map((el) => {
//           return {
//             ...el,
//             quantity: this.cart.items.find(
//               (prod) => prod.productId.toString() === el._id.toString()
//             ).quantity,
//           };
//         });
//       });
//   }

//   addOrder() {
//     const db = getDb();
//     return this.getCart()
//       .then((products) => {
//         const order = {
//           items: products,
//           user: { _id: this._id, username: this.username },
//         };
//         return db.collection("orders").insertOne(order);
//       })
//       .then(() => {
//         const updatedCart = { items: [] };
//         return db
//           .collection("users")
//           .updateOne({ _id: this._id }, { $set: { cart: updatedCart } });
//       })
//       .catch((err) => next(err));
//   }

//   getOrders() {
//     const db = getDb();
//     return db
//       .collection("orders")
//       .find({ "user._id": this._id })
//       .toArray()
//       .then((products) => products)
//       .catch((err) => next(err));
//   }

//   static findById(id) {
//     const db = getDb();
//     return db
//       .collection("users")
//       .find({ _id: new mongodb.ObjectId(id) })
//       .next();
//   }
// }

// module.exports = User;
