import User from '../models/User.js';
import bcrypt from 'bcrypt';
import AuthHelper from '../utils/authHelper.js';

class UserController {
    // Obtener todos los usuarios (solo admin)
    static async getAllUsers() {
        try {
            const users = await User.findAll({
                attributes: { exclude: ['password'] }
            });
            return users;
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            throw new Error('No se pudieron obtener los usuarios');
        }
    }

    // Obtener un usuario por ID
    static async getUserById(userId) {
        try {
            const user = await User.findByPk(userId, {
                attributes: { exclude: ['password'] }
            });
            
            if (!user) {
                throw new Error('Usuario no encontrado');
            }
            
            return user;
        } catch (error) {
            console.error('Error al obtener usuario:', error);
            throw error;
        }
    }

    // Actualizar perfil de usuario
    static async updateProfile(userId, userData) {
        try {
            const user = await User.findByPk(userId);
            
            if (!user) {
                throw new Error('Usuario no encontrado');
            }
            
            // Campos que se pueden actualizar
            const { nombre, email } = userData;
            
            // Actualizar campos
            if (nombre) user.nombre = nombre;
            if (email) user.email = email;
            
            await user.save();
            
            // Retornar usuario sin contraseña
            const updatedUser = {
                ...user.get(),
                password: undefined
            };
            
            return updatedUser;
        } catch (error) {
            console.error('Error al actualizar perfil:', error);
            throw error;
        }
    }

    // Cambiar contraseña
    static async changePassword(userId, { currentPassword, newPassword }) {
        try {
            const user = await User.findByPk(userId);
            
            if (!user) {
                throw new Error('Usuario no encontrado');
            }
            
            // Verificar contraseña actual
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                throw new Error('Contraseña actual incorrecta');
            }
            
            // Encriptar nueva contraseña
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
            
            await user.save();
            
            return { message: 'Contraseña actualizada correctamente' };
        } catch (error) {
            console.error('Error al cambiar contraseña:', error);
            throw error;
        }
    }

    // Crear usuario (solo admin)
    static async createUser(userData) {
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
            
            // Generar token para el nuevo usuario
            const token = AuthHelper.generateToken(newUser.id);
            
            // Retornar usuario sin contraseña
            const user = {
                ...newUser.get(),
                password: undefined
            };
            
            return { user, token };
        } catch (error) {
            console.error('Error al crear usuario:', error);
            throw error;
        }
    }

    // Eliminar usuario (solo admin)
    static async deleteUser(userId) {
        try {
            const user = await User.findByPk(userId);
            
            if (!user) {
                throw new Error('Usuario no encontrado');
            }
            
            await user.destroy();
            
            return { message: 'Usuario eliminado correctamente' };
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            throw error;
        }
    }
}

export default UserController;