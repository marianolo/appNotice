import express from 'express';
import ApiNewsController from '../controllers/ApiNewsController.js';
import { authenticateUser as authMiddleware, isAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rutas públicas (sin autenticación)
router.get('/', ApiNewsController.getApiNews);

// Rutas protegidas (requieren autenticación)
router.use(authMiddleware);

// Sincronizar noticias desde fuentes externas
router.get('/sync', isAdmin, ApiNewsController.syncNewsFromAPI);

// Obtener estadísticas de noticias de API
router.get('/stats', ApiNewsController.getApiNewsStats);

// Obtener noticias pendientes (para aprobación/rechazo)
router.get('/pending', isAdmin, ApiNewsController.getPendingNews);

// Actualizar estado de una noticia específica (aprobar/rechazar) - controlador en desuso
router.put('/:id/status', isAdmin, ApiNewsController.updateNews);

// Actualizar estado de una noticia específica (aprobar/rechazar)
router.put('/:id/statusNewApi', isAdmin, ApiNewsController.updateNewsStatus);

// Actualización completa de una noticia de API (incluye categoría)
router.put('/:id', isAdmin, ApiNewsController.updateNews);

// Actualizar estado en lote (múltiples noticias)
router.put('/status', isAdmin, ApiNewsController.updateMultipleNewsStatus);

// Eliminar una noticia de API
router.delete('/:id', isAdmin, ApiNewsController.deleteApiNews);

export default router;