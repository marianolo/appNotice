import { db, connectDB } from './config/db.js';
import User from './models/User.js';

// Función para probar la base de datos
const testDB = async () => {
    try {
        await connectDB();
        
        // Verificar si la tabla users existe y tiene registros
        try {
            const count = await User.count();
            console.log(`✅ La tabla 'users' existe y tiene ${count} registros`);
            
            // Mostrar estructura del modelo
            console.log("Estructura del modelo User:");
            console.log(User.rawAttributes);
            
        } catch (error) {
            console.error("Error al consultar la tabla 'users':", error);
        }
    } catch (error) {
        console.error("Error general:", error);
    } finally {
        process.exit();
    }
};

testDB();