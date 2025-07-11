import { DataTypes } from "sequelize";
import { db } from "../config/db.js";

const Categorys = db.define("Categorys", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  category_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
  }
}, {
  timestamps: false,
  tableName: "category"
});


export default Categorys;