import express from 'express';
import AuthController from '../controllers/authController.js';
import { authenticateUser } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Ruta de registro con logs
router.post('/register', async (req, res) => {
    console.log('[REGISTER] Solicitud recibida:', req.body);
    try {
        const userData = req.body;
        const result = await AuthController.register(userData);
        console.log('[REGISTER] Usuario registrado exitosamente:', result.user.email);
        res.status(201).json(result);
    } catch (error) {
        console.error('[REGISTER] Error en el registro:', error.message);
        res.status(400).json({ 
            message: 'Error en el registro', 
            error: error.message 
        });
    }
});

// Ruta de inicio de sesión con logs
router.post('/login', async (req, res) => {
    console.log('[LOGIN] Intento de inicio de sesión:', req.body.email);
    try {
        const { email, password } = req.body;
        const result = await AuthController.login(email, password);
        console.log('[LOGIN] Usuario autenticado exitosamente:', email);
        res.status(200).json(result);
    } catch (error) {
        console.error('[LOGIN] Error en el inicio de sesión:', error.message);
        res.status(401).json({ 
            message: 'Inicio de sesión fallido', 
            error: error.message 
        });
    }
});

// Ruta de cierre de sesión
router.post('/logout', authenticateUser, async (req, res) => {
    console.log('[LOGOUT] Cerrando sesión para usuario:', req.user.email);
    try {
        res.status(200).json({ 
            message: 'Sesión cerrada exitosamente',
            success: true
        });
    } catch (error) {
        console.error('[LOGOUT] Error al cerrar sesión:', error.message);
        res.status(500).json({ 
            message: 'Error al cerrar sesión', 
            error: error.message 
        });
    }
});

// Ruta de perfil (ejemplo de ruta protegida)
router.get('/profile', authenticateUser, (req, res) => {
    console.log('[PROFILE] Acceso al perfil del usuario:', req.user.email);
    res.status(200).json(req.user);
});

export default router;