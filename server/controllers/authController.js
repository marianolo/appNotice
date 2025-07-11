import User from '../models/User.js';
import AuthHelper from '../utils/authHelper.js';

class AuthController {
    // Registro de usuario
    static async register(userData) {
        try {
            console.log('[AuthController] Procesando registro para:', userData.email);
            const { nombre, email, password, rol } = userData;

            // Verificar si el usuario ya existe
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                console.log('[AuthController] Email ya registrado:', email);
                throw new Error('El correo electrónico ya está registrado');
            }

            // Hashear contraseña
            const hashedPassword = await AuthHelper.hashPassword(password);

            // Crear usuario
            const user = await User.create({
                nombre,
                email,
                password: hashedPassword,
                rol: rol || 'editor'
            });

            console.log('[AuthController] Usuario creado con ID:', user.id);

            // Generar token
            const token = AuthHelper.generateToken(user);

            return {
                user: {
                    id: user.id,
                    nombre: user.nombre,
                    email: user.email,
                    rol: user.rol
                },
                token
            };
        } catch (error) {
            console.error('[AuthController] Error en el registro:', error.message);
            throw new Error(`Error en el registro: ${error.message}`);
        }
    }

    // Inicio de sesión
    static async login(email, password) {
        try {
            console.log('[AuthController] Procesando login para:', email);
            
            // Buscar usuario
            const user = await User.findOne({ where: { email } });
            if (!user) {
                console.log('[AuthController] Usuario no encontrado:', email);
                throw new Error('Credenciales inválidas');
            }

            // Verificar contraseña
            const isMatch = await AuthHelper.comparePassword(password, user.password);
            if (!isMatch) {
                console.log('[AuthController] Contraseña incorrecta para:', email);
                throw new Error('Credenciales inválidas');
            }

            console.log('[AuthController] Login exitoso para:', email);
            
            // Generar token
            const token = AuthHelper.generateToken(user);

            return {
                user: {
                    id: user.id,
                    nombre: user.nombre,
                    email: user.email,
                    rol: user.rol
                },
                token
            };
        } catch (error) {
            console.error('[AuthController] Error en el login:', error.message);
            throw new Error(`Error en el inicio de sesión: ${error.message}`);
        }
    }
}

export default AuthController;