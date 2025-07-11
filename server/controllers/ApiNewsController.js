import ApiNewsService from '../services/ApiNewsService.js';

class ApiNewsController {
    /**
     * Sincroniza noticias desde la API externa (GNews)
     * @param {Request} req - Express request
     * @param {Response} res - Express response
     */
    static async syncNewsFromAPI(req, res) {
        try {
            const { category = 'general' } = req.query; // Mejor desestructuración con valor por defecto
            const result = await ApiNewsService.fetchAndSaveNews(category);
            
            return res.status(result.success ? 200 : 500).json(result);
        } catch (error) {
            console.error('Error en syncNewsFromAPI:', error);
            return res.status(500).json({
                success: false,
                message: `Error al sincronizar noticias: ${error.message}`,
                error: error.message // Agregado el error para desarrollo
            });
        }
    }

    /**
     * Obtiene noticias guardadas de la API
     * @param {Request} req - Express request
     * @param {Response} res - Express response
     */
    static async getApiNews(req, res) {
        try {
            const { page = 1, limit = 10, category } = req.query;
            const result = await ApiNewsService.getNewsFromDatabase(
                parseInt(page), 
                parseInt(limit), 
                category
            );
            
            return res.status(result.success ? 200 : 500).json(result);
        } catch (error) {
            console.error('Error en getApiNews:', error);
            return res.status(500).json({
                success: false,
                message: `Error al obtener noticias: ${error.message}`,
                error: error.message
            });
        }
    }

    /**
     * Obtiene las noticias pendientes para aprobación/rechazo
     * @param {Request} req - Express request
     * @param {Response} res - Express response
     */
    static async getPendingNews(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const pageSize = parseInt(req.query.pageSize) || 20;
            
            const result = await ApiNewsService.getPendingNews(page, pageSize);
            
            return res.status(200).json(result);
        } catch (error) {
            console.error('Error al obtener noticias pendientes:', {
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
            return res.status(500).json({ 
                success: false,
                message: 'Error al obtener noticias pendientes',
                error: error.message 
            });
        }
    }

    /**
     * Obtiene estadísticas de las noticias guardadas
     * @param {Request} req - Express request
     * @param {Response} res - Express response
     */
    static async getApiNewsStats(req, res) {
        try {
            const result = await ApiNewsService.getNewsStats();
            return res.status(result.success ? 200 : 500).json(result);
        } catch (error) {
            console.error('Error en getApiNewsStats:', error);
            return res.status(500).json({
                success: false,
                message: `Error al obtener estadísticas: ${error.message}`,
                error: error.message
            });
        }
    }

    /**
     * Actualiza el estado de una noticia de API
     * @param {Request} req - Express request
     * @param {Response} res - Express response
     */
    static async updateNews(req, res) {
        try {
            const { id } = req.params;
            const { estado, categoria_id } = req.body;
            
            // Validación adicional para el ID
            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de noticia no válido'
                });
            }
    
            // Validar que el estado sea uno de los permitidos
            const validStates = ['pendiente', 'aprobada', 'rechazada'];
            if (!estado || !validStates.includes(estado)) {
                return res.status(400).json({
                    success: false,
                    message: `Estado no válido. Debe ser uno de: ${validStates.join(', ')}`
                });
            }
    
            const result = await ApiNewsService.updateNews(id, { estado });
            
            if (!result.success) {
                return res.status(404).json(result);
            }
            
            return res.status(200).json(result);
        } catch (error) {
            console.error('Error en updateNewsStatus:', error);
            return res.status(500).json({
                success: false,
                message: `Error al actualizar el estado de la noticia: ${error.message}`,
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }
    static async updateNewsStatus(req, res) {
        try {
            const { id } = req.params;
            const { estado, categoria_id } = req.body;
            
            // Validación adicional para el ID
            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de noticia no válido'
                });
            }
    
            // Validar que el estado sea uno de los permitidos
            const validStates = ['pendiente', 'aprobada', 'rechazada'];
            if (!estado || !validStates.includes(estado)) {
                return res.status(400).json({
                    success: false,
                    message: `Estado no válido. Debe ser uno de: ${validStates.join(', ')}`
                });
            }
    
            const result = await ApiNewsService.updateNewsStatus(id, estado, categoria_id);
            
            if (!result.success) {
                return res.status(404).json(result);
            }
            
            return res.status(200).json(result);
        } catch (error) {
            console.error('Error en updateNewsStatus:', error);
            return res.status(500).json({
                success: false,
                message: `Error al actualizar el estado de la noticia: ${error.message}`,
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }

    /**
     * Actualiza el estado de múltiples noticias a la vez
     * @param {Request} req - Express request
     * @param {Response} res - Express response
     */
    static async updateMultipleNewsStatus(req, res) {
        try {
            const { ids, estado, categoria_id } = req.body;
            
            if (!ids || !Array.isArray(ids)) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Se requiere un array de IDs' 
                });
            }
            
            if (!estado || !['aprobada', 'rechazada', 'pendiente'].includes(estado)) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Estado inválido. Debe ser "aprobada", "rechazada" o "pendiente"' 
                });
            }
            
            // Si estamos aprobando, aseguramos que la categoría se proporcione
            if (estado === 'aprobada' && !categoria_id) {
                return res.status(400).json({
                    success: false,
                    message: 'La categoría es obligatoria para aprobar noticias'
                });
            }
            
            const result = await ApiNewsService.updateMultipleNewsStatus(ids, estado, categoria_id);
            
            return res.status(200).json(result);
        } catch (error) {
            console.error('Error al actualizar estado de múltiples noticias:', {
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
            return res.status(500).json({ 
                success: false,
                message: 'Error al actualizar el estado de las noticias', 
                error: error.message 
            });
        }
    }

    /**
     * Actualiza una noticia de API (con soporte para actualización parcial)
     * @param {Request} req - Express request
     * @param {Response} res - Express response
     */
    static async updateNews(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de noticia no proporcionado'
                });
            }
            
            if (Object.keys(updateData).length > 1 && (!updateData.categoria_id && !updateData.estado)) {
                if (!updateData.titulo?.trim() || !updateData.contenido?.trim()) {
                    return res.status(400).json({
                        success: false,
                        message: 'El título y el contenido son obligatorios para una actualización completa'
                    });
                }
            }
            
            const result = await ApiNewsService.updateNews(id, updateData);
            
            if (!result.success) {
                return res.status(404).json(result);
            }
            
            return res.status(200).json(result);
        } catch (error) {
            console.error('Error en updateNews:', error);
            return res.status(500).json({
                success: false,
                message: `Error al actualizar la noticia: ${error.message}`,
                error: error.message
            });
        }
    }

    /**
     * Elimina una noticia de API
     * @param {Request} req - Express request
     * @param {Response} res - Express response
     */
    static async deleteApiNews(req, res) {
        try {
            const { id } = req.params;
            
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de noticia no proporcionado'
                });
            }
            
            // Añadir validación de ID numérico
            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de noticia debe ser un número'
                });
            }
            
            const result = await ApiNewsService.deleteNews(id);
            
            if (!result.success) {
                return res.status(404).json(result);
            }
            
            return res.status(200).json(result);
        } catch (error) {
            console.error('Error en deleteApiNews:', error);
            return res.status(500).json({
                success: false,
                message: `Error al eliminar la noticia: ${error.message}`,
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }
}

export default ApiNewsController;