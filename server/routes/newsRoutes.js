import express from 'express';
import NewsController from '../controllers/newsController.js';
import { authenticateUser as authMiddleware, isAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rutas públicas (sin autenticación)
router.get('/public', async (req, res) => { 
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const categoria = req.query.categoria || null;
        
        const result = await NewsController.getCombinedPublicNews(page, pageSize, categoria);

        res.status(200).json(result);
    } catch (error) {
        console.error('Error al obtener noticias públicas:', {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        res.status(500).json({ 
            message: 'Error al obtener noticias públicas',
            error: error.message 
        });
    }
});


// Ruta para obtener todas las noticias sin límites
router.get("/publicAll", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 100;

        const result = await NewsController.getAllCombinedPublicNews(page, pageSize);
        
        res.status(200).json(result);
    } catch (error) {
        console.error('Error al obtener noticias públicas:', {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        res.status(500).json({ 
            message: 'Error al obtener noticias públicas',
            error: error.message 
        });
    }
});

// Ruta para obtener noticias locales publicadas
router.get('/local', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        
        const result = await NewsController.getLocalPublishedNews(page, pageSize);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error al obtener noticias locales:', {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        res.status(500).json({ 
            message: 'Error al obtener noticias locales',
            error: error.message 
        });
    }
});

// Rutas protegidas (requieren autenticación)
router.use(authMiddleware);

// Rutas para noticias locales (manuales)
router.get('/news/:id', NewsController.getLocalNewsById);
router.put('/news/:id', isAdmin, NewsController.updateLocalNews);
router.delete('/news/:id', isAdmin, NewsController.deleteLocalNews);
router.post('/news', isAdmin, async (req, res) => {
    try {
        const userId = req.user.id;
        const { isExternal, ...newsData } = req.body;
        
        // Validaciones básicas
        if (!newsData.titulo || !newsData.contenido) {
            return res.status(400).json({ message: 'El título y contenido son requeridos' });
        }
        
        const newNews = await NewsController.createNews(newsData, userId, isExternal);
        
        // IMPORTANTE: Forzar invalidación de cachés aquí también
        await NewsController.invalidateNewsCaches();
        
        res.status(201).json(newNews);
    } catch (error) {
        console.error('Error al crear noticia:', {
            message: error.message,
            stack: error.stack,
            body: req.body,
            user: req.user,
            timestamp: new Date().toISOString()
        });
        res.status(500).json({ 
            message: error.message || 'Error al crear la noticia',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Rutas para noticias de API
router.get('/api-news', NewsController.getPublishedApiNews);
router.get('/api-news/pending', isAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;
        
        const result = await NewsController.getPendingExternalNews(page, pageSize);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error al obtener noticias pendientes:', {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        res.status(500).json({ 
            message: 'Error al obtener noticias pendientes',
            error: error.message 
        });
    }
});

router.put('/api-news/:id', isAdmin, NewsController.updateApiNews);
router.delete('/api-news/:id', isAdmin, NewsController.deleteApiNews);

// Actualizar el estado de noticias (soporta múltiples IDs)
router.put('/api-news/status', isAdmin, async (req, res) => {
    try {
        const { ids, estado, categoriaApi } = req.body;

        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({ message: 'Se requiere un array de IDs' });
        }
        
        if (!estado || !['aprobada', 'rechazada', 'pendiente'].includes(estado)) {
            return res.status(400).json({ 
                message: 'Estado inválido. Debe ser "aprobada", "rechazada" o "pendiente"' 
            });
        }
        
        const result = await NewsController.updateNewsStatus(ids, estado, categoriaApi);
        
        res.status(200).json(result);
    } catch (error) {
        console.error('Error al actualizar estado de noticias:', {
            message: error.message,
            stack: error.stack,
            body: req.body,
            timestamp: new Date().toISOString()
        });
        res.status(500).json({ 
            message: 'Error al actualizar el estado de la noticia', 
            error: error.message 
        });
    }
});

// Ruta para obtener/actualizar noticias externas
router.post('/fetch-external', isAdmin, async (req, res) => {
    try {
        const result = await NewsController.fetchExternalNews();
        res.status(200).json(result);
    } catch (error) {
        console.error('Error al obtener noticias externas:', {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        res.status(500).json({ 
            message: error.message || 'Error al obtener noticias externas',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Ruta adicional para obtener noticias externas (alias)
router.get('/fetch-external-news', isAdmin, async (req, res) => {
    try {
        const result = await NewsController.fetchExternalNews();
        res.status(200).json(result);
    } catch (error) {
        console.error('Error al obtener noticias externas:', {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        res.status(500).json({ 
            message: error.message || 'Error al obtener noticias externas',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Ruta adicional para obtener noticias pendientes (alias)
// router.get('/pending-news', isAdmin, async (req, res) => {
router.get('/pending-news', isAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;
        
        const result = await NewsController.getPendingExternalNews(page, pageSize);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error al obtener noticias pendientes:', {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        res.status(500).json({ 
            message: 'Error al obtener noticias pendientes',
            error: error.message 
        });
    }
});

export default router;