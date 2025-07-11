import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const db = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT || "mysql",
    logging: false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

let reconnectAttempts = 0;
const connectDB = async () => {
    try {
        await db.authenticate();
        await db.sync({ force: false });
        console.log("✅ Conexión a la base de datos establecida correctamente");
    } catch (error) {
        reconnectAttempts++;
        if (reconnectAttempts < 5) {
            setTimeout(connectDB, 5000);
        }
    }
};

export { db, connectDB };