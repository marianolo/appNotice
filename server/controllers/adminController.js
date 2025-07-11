import NewsController from './newsController.js';
import ApiNews from '../models/ApiNews.js';
import News from '../models/News.js';

class AdminNewsController {
    static async approveExternalNews(newsId, userId) {
        try {
            // Obtener la noticia primero
            const newsToApprove = await ApiNews.findByPk(newsId);
            
            if (!newsToApprove) {
                throw new Error('Noticia no encontrada');
            }
            
            // Cambiar estado en ApiNews
            await NewsController.updateNewsStatus([newsId], 'aprobada');
            
            // Convertirla en una noticia regular con autor admin
            const regularNews = await News.create({
                titulo: newsToApprove.titulo,
                contenido: newsToApprove.contenido,
                imagen: newsToApprove.imagen,
                autor_id: userId,
                estado: 'publicada' // Ya está aprobada
            });
            
            return {
                message: 'Noticia aprobada y publicada correctamente',
                news: regularNews
            };
        } catch (error) {
            console.error('Error al aprobar noticia externa:', error);
            throw new Error(`No se pudo aprobar la noticia externa: ${error.message}`);
        }
    }
    
    static async rejectExternalNews(newsId) {
        try {
            const newsToReject = await ApiNews.findByPk(newsId);
            
            if (!newsToReject) {
                throw new Error('Noticia no encontrada');
            }
            
            // Cambiar estado en ApiNews
            await NewsController.updateNewsStatus([newsId], 'rechazada');
            
            return {
                message: 'Noticia rechazada correctamente',
                newsId: newsId
            };
        } catch (error) {
            console.error('Error al rechazar noticia externa:', error);
            throw new Error(`No se pudo rechazar la noticia externa: ${error.message}`);
        }
    }
    
    // Método para crear una noticia manualmente por el admin
    static async createAdminNews(newsData, userId) {
        try {
            // Crear noticia con datos proporcionados por el admin
            const newNews = await News.create({
                ...newsData,
                autor_id: userId,
                estado: 'publicada' // Las noticias creadas por admin son publicadas automáticamente
            });
            
            return newNews;
        } catch (error) {
            console.error('Error al crear noticia de admin:', error);
            throw new Error(`No se pudo crear la noticia: ${error.message}`);
        }
    }
    
    // Método para obtener todas las noticias
    static async getAllNews() {
        try {
            // Obtener noticias de API pendientes
            const apiNewsPending = await ApiNews.findAll({
                where: { estado: 'pendiente' },
                order: [['createdAt', 'DESC']]
            });
            
            return apiNewsPending;
        } catch (error) {
            console.error('Error al obtener todas las noticias:', error);
            throw new Error('No se pudieron obtener todas las noticias');
        }
    }
}

export default AdminNewsController;