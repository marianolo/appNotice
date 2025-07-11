import { DataTypes } from 'sequelize';
import { db } from '../config/db.js';
import Categorys from './Categorys.js';

const ApiNews = db.define("api_news", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    fuente: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    titulo: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    contenido: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    url: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true
    },
    imagen: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    fecha_publicacion: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW
    },
    estado: {
        type: DataTypes.ENUM("pendiente", "aprobada", "rechazada"),
        defaultValue: "pendiente"
    },
    categoria_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Categorys,
            key: "id",
        }
    },
}, {
    timestamps: false, 
    tableName: 'api_news'
});

ApiNews.belongsTo(Categorys, {
    foreignKey: "categoria_id",
    onDelete: "CASCADE",
    as: "categorApi"
});

Categorys.hasMany(ApiNews, {
    foreignKey: "categoria_id",
    as: "categorApi"
});

export default ApiNews;