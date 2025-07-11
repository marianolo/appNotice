import express from 'express';
import AdminNewsController from '../controllers/adminController.js';

const router = express.Router();

const isAdmin = (req, res, next) => {
   
    req.user = { id: 1, rol: 'admin' };
    
    if (req.user && req.user.rol === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'No autorizado' });
    }
};

// Ruta para aprobar una noticia de API externa
router.post('/approve-external-news/:id', isAdmin, async (req, res) => {
    try {
        const newsId = req.params.id;
        const userId = req.user.id;
        
        const approvedNews = await AdminNewsController.approveExternalNews(newsId, userId);
        res.status(200).json(approvedNews);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error al aprobar noticia', 
            error: error.message 
        });
    }
});

// Ruta para rechazar una noticia de API externa
router.post('/reject-external-news/:id', isAdmin, async (req, res) => {
    try {
        const newsId = req.params.id;
        
        const result = await AdminNewsController.rejectExternalNews(newsId);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error al rechazar noticia', 
            error: error.message 
        });
    }
});

// Ruta para crear una noticia por el admin
router.post('/create-news', isAdmin, async (req, res) => {
    try {
        const newsData = req.body;
        const userId = req.user.id;
        
        const newNews = await AdminNewsController.createAdminNews(newsData, userId);
        res.status(201).json(newNews);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error al crear noticia', 
            error: error.message 
        });
    }
});

// Ruta para obtener todas las noticias
router.get('/all-news', isAdmin, async (req, res) => {
    try {
        const allNews = await AdminNewsController.getAllNews();
        res.status(200).json(allNews);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error al obtener todas las noticias', 
            error: error.message 
        });
    }
});

export default router;