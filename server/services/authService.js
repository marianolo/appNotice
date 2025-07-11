import bcrypt from 'bcrypt';
import User from '../models/User.js';
import AuthHelper from '../utils/authHelper.js';

class AuthService {
    constructor() {
        // Blacklist de tokens en memoria
        this.tokenBlacklist = {};
        
        // Limpiar tokens expirados periódicamente
        this.cleanupInterval = setInterval(() => this.cleanupExpiredTokens(), 60000); // Cada minuto
    }
    
    /**
     * Limpia tokens expirados de la blacklist
     */
    cleanupExpiredTokens() {
        const now = Math.floor(Date.now() / 1000);
        Object.keys(this.tokenBlacklist).forEach(token => {
            if (this.tokenBlacklist[token] <= now) {
                delete this.tokenBlacklist[token];
            }
        });
    }

    // Registro de usuario
    static async register(userData) {
        try {
            const { nombre, email, password, rol } = userData;
            
            // Verificar si el email ya existe
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                throw new Error('El email ya está registrado');
            }
            
            // Encriptar contraseña
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            
            // Crear usuario
            const newUser = await User.create({
                nombre,
                email,
                password: hashedPassword,
                rol: rol || 'editor'
            });
            
            // Generar token
            const token = AuthHelper.generateToken(newUser.id);
            
            // Retornar usuario sin contraseña
            const user = {
                ...newUser.get(),
                password: undefined
            };
            
            return { user, token };
        } catch (error) {
            console.error('Error en registro:', error);
            throw error;
        }
    }

    // Login de usuario
    static async login(email, password) {
        try {
            // Buscar usuario
            const user = await User.findOne({ where: { email } });
            
            if (!user) {
                throw new Error('Credenciales inválidas');
            }
            
            // Verificar contraseña
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                throw new Error('Credenciales inválidas');
            }
            
            // Generar token
            const token = AuthHelper.generateToken(user.id);
            
            // Retornar usuario sin contraseña
            const userData = {
                ...user.get(),
                password: undefined
            };
            
            return { user: userData, token };
        } catch (error) {
            console.error('Error en login:', error);
            throw error;
        }
    }

    // Logout (invalidar token)
    static async logout(token) {
        try {
            if (!token) {
                throw new Error('Token no proporcionado');
            }
            
            // Decodificar token para obtener tiempo de expiración
            const decoded = AuthHelper.verifyToken(token);
            
            if (!decoded) {
                throw new Error('Token inválido');
            }
            
            // Calcular tiempo de expiración en segundos
            const now = Math.floor(Date.now() / 1000);
            const expiryTime = decoded.exp;
            
            // Si el token ya expiró, no es necesario agregar a la blacklist
            if (expiryTime <= now) {
                return { message: 'Sesión cerrada correctamente' };
            }
            
            // Guardar en blacklist en memoria
            AuthService.instance.tokenBlacklist[token] = expiryTime;
            
            return { message: 'Sesión cerrada correctamente' };
        } catch (error) {
            console.error('Error en logout:', error);
            throw error;
        }
    }

    // Verificar si un token está en la blacklist
    static async isTokenBlacklisted(token) {
        try {
            return !!AuthService.instance.tokenBlacklist[token];
        } catch (error) {
            console.error('Error al verificar token en blacklist:', error);
            return false;
        }
    }
}

// Crear una única instancia para la blacklist de tokens
AuthService.instance = new AuthService();

export default AuthService;