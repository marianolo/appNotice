import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Verifica que las variables de entorno estén cargadas
if (!process.env.JWT_SECRET) {
    throw new Error("SECRET_KEY no está definida en el archivo .env");
}

const SECRET_KEY = process.env.JWT_SECRET;

const AuthHelper = {
    // Genera un token JWT para un usuario
    generateToken: (user) => {
        return jwt.sign(
            { id: user.id, rol: user.rol },
            SECRET_KEY,
            { expiresIn: '2h' }
        );
    },
    
    // Verifica un token JWT
    verifyToken: (token) => {
        try {
            return jwt.verify(token, SECRET_KEY);
        } catch (error) {
            console.error('[AuthHelper] Error al verificar token:', error.message);
            return null; // Token inválido o expirado
        }
    },
    
    // Hashear contraseña
    hashPassword: async (password) => {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    },
    
    // Comparar contraseña
    comparePassword: async (password, hash) => {
        return await bcrypt.compare(password, hash);
    }
};

export default AuthHelper;