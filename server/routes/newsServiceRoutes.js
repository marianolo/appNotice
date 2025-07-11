import express from 'express';
import NewsService from '../services/newsService.js';
import { authenticateUser } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Ruta para obtener noticias con filtros avanzados
router.get('/filtered', authenticateUser, async (req, res) => {
    try {
        const filters = req.query;
        const news = await NewsService.getFilteredNews(filters);
        res.status(200).json(news);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error al obtener noticias', 
            error: error.message 
        });
    }
});

// Ruta para obtener tendencias de noticias
router.get('/trends', authenticateUser, async (req, res) => {
    try {
        const trends = await NewsService.getNewsTrends();
        res.status(200).json(trends);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error al obtener tendencias', 
            error: error.message 
        });
    }
});

// Ruta para obtener recomendaciones de noticias
router.get('/recommendations', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const recommendations = await NewsService.getNewsRecommendations(userId);
        res.status(200).json(recommendations);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error al obtener recomendaciones', 
            error: error.message 
        });
    }
});

// Ruta para exportar noticias
router.get('/export', authenticateUser, async (req, res) => {
    try {
        const filters = req.query;
        const exportData = await NewsService.exportNews(filters);
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${exportData.filename}`);
        res.send(exportData.content);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error al exportar noticias', 
            error: error.message 
        });
    }
});

export default router;