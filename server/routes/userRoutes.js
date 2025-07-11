import express from 'express';
import UserController from '../controllers/userController.js';
import { authenticateUser, isAdmin } from '../middlewares/authMiddleware.js';
import adminMiddleware from '../middlewares/adminMiddleware.js';

const router = express.Router();

// Ruta para obtener el perfil del usuario actual
router.get('/profile', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await UserController.getUserById(userId);
        res.status(200).json(user);
    } catch (error) {
        res.status(404).json({
            message: 'Error al obtener perfil',
            error: error.message
        });
    }
});

// Ruta para actualizar el perfil del usuario actual
router.put('/profile', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const updatedUser = await UserController.updateProfile(userId, req.body);
        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(400).json({
            message: 'Error al actualizar perfil',
            error: error.message
        });
    }
});

// Ruta para cambiar contraseña
router.put('/password', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: 'Se requieren contraseña actual y nueva'
            });
        }
        
        const result = await UserController.changePassword(userId, { currentPassword, newPassword });
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({
            message: 'Error al cambiar contraseña',
            error: error.message
        });
    }
});

// Rutas para administradores

// Obtener todos los usuarios (solo admin)
router.get('/', adminMiddleware, async (req, res) => {
    try {
        const users = await UserController.getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({
            message: 'Error al obtener usuarios',
            error: error.message
        });
    }
});

// Crear nuevo usuario (solo admin)
router.post('/', adminMiddleware, async (req, res) => {
    try {
        const result = await UserController.createUser(req.body);
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({
            message: 'Error al crear usuario',
            error: error.message
        });
    }
});

// Obtener usuario por ID (solo admin)
router.get('/:id', adminMiddleware, async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await UserController.getUserById(userId);
        res.status(200).json(user);
    } catch (error) {
        res.status(404).json({
            message: 'Error al obtener usuario',
            error: error.message
        });
    }
});

// Eliminar usuario (solo admin)
router.delete('/:id', adminMiddleware, async (req, res) => {
    try {
        const userId = req.params.id;
        const result = await UserController.deleteUser(userId);
        res.status(200).json(result);
    } catch (error) {
        res.status(404).json({
            message: 'Error al eliminar usuario',
            error: error.message
        });
    }
});

export default router;