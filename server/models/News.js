import { DataTypes } from 'sequelize';
import { db } from '../config/db.js';
import User from './User.js';
import Categorys from './Categorys.js';

const News = db.define("News", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    titulo: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    contenido: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    imagen: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    autor_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    estado: {
        type: DataTypes.ENUM("pendiente", "publicada", "rechazada"),
        defaultValue: "pendiente"
    },
    categoria_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Categorys,
            key: "id"
        }
    }
}, {
    timestamps: true
});

// Relaciones
News.belongsTo(User, { 
    foreignKey: "autor_id", 
    onDelete: "CASCADE",
    as: "autor" 
});
User.hasMany(News, { 
    foreignKey: "autor_id",
    as: "noticias" 
});

News.belongsTo(Categorys, {
    foreignKey: "categoria_id",
    onDelete: "CASCADE",
    as: "categor"
});
Categorys.hasMany(News, {
    foreignKey: "categoria_id",
    as: "categor"
})

export default News;