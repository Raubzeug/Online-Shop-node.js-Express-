const Cart = require("./cart");
const Sequelize = require("sequelize").Sequelize;
const sequelize = require("../utils/database");

const Product = sequelize.define("product", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  title: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  price: {
    type: Sequelize.DOUBLE,
    allowNull: false,
  },
  description: Sequelize.STRING,
  imgUrl: Sequelize.STRING,

});


module.exports = Product;
