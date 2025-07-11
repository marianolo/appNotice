import { DataTypes } from 'sequelize'; 
import { db } from '../config/db.js';  

const User = db.define("User", {     
  id: {         
    type: DataTypes.INTEGER,         
    autoIncrement: true,         
    primaryKey: true     
  },     
  nombre: {         
    type: DataTypes.STRING(255),         
    allowNull: false     
  },     
  email: {         
    type: DataTypes.STRING(255),         
    allowNull: false,         
    unique: true,         
    validate: {             
      isEmail: true         
    }     
  },     
  password: {         
    type: DataTypes.STRING(255),         
    allowNull: false     
  },     
  rol: {         
    type: DataTypes.ENUM("admin", "editor"),         
    defaultValue: "editor"     
  } 
}, {     
  timestamps: true 
});  

export default User;