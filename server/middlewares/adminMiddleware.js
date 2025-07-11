import User from '../models/User.js';
import AuthHelper from '../utils/authHelper.js';

const adminMiddleware = async (req, res, next) => {
    try {
        // Obtener token del header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'No se proporcionó token de autenticación' });
        }

        // Verificar token
        const decoded = AuthHelper.verifyToken(token);

        if (!decoded) {
            return res.status(401).json({ message: 'Token inválido o expirado' });
        }

        // Buscar usuario
        const user = await User.findByPk(decoded.id, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(401).json({ message: 'Usuario no encontrado' });
        }

        // Verificar que sea administrador
        if (user.rol !== 'admin') {
            return res.status(403).json({ message: 'Acceso denegado. Se requieren permisos de administrador' });
        }

        // Adjuntar usuario al request
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ 
            message: 'Autenticación de administrador fallida', 
            error: error.message 
        });
    }
};

export default adminMiddleware;