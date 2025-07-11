import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

class AuthHelper {
    // Generar token JWT
    static generateToken(user) {
        return jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                rol: user.rol 
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: '24h' }
        );
    }

    // Hashear contraseña
    static async hashPassword(password) {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(password, salt);
    }

    // Comparar contraseña
    static async comparePassword(inputPassword, storedPassword) {
        return bcrypt.compare(inputPassword, storedPassword);
    }

    // Verificar token
    static verifyToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return null;
        }
    }
}
