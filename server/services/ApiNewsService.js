import axios from 'axios';
import ApiNews from '../models/ApiNews.js';
import Categorys from '../models/Categorys.js';
import apiConfig from '../config/apiConfig.js';

class ApiNewsService {
    /**
     * Obtiene noticias desde la API de GNews y las guarda en la base de datos
     * @param {string} category - Categoría de noticias a buscar
     * @returns {Object} Resultado de la operación
     */
    static async fetchAndSaveNews(category = 'general') {
        try {
            // Consultamos la API de GNews con la configuración establecida
            const response = await axios.get(apiConfig.gnews.baseUrl, {
                params: {
                    ...apiConfig.gnews.defaultParams,
                    topic: category,  // GNews usa "topic" en lugar de "category"
                    apikey: apiConfig.gnews.apiKey  // GNews usa "apikey" en minúsculas
                }
            });

            if (!response.data || !response.data.articles) {
                throw new Error('Formato de respuesta inesperado de la API de noticias');
            }

            const newsToSave = response.data.articles.map(article => ({
                fuente: article.source?.name || 'Desconocida',
                titulo: article.title,
                contenido: article.description || article.content || 'Sin contenido disponible',
                url: article.url,
                imagen: article.image || 'https://via.placeholder.com/600x400?text=Sin+imagen',
                estado: 'pendiente',
                fecha_publicacion: article.publishedAt || new Date().toISOString(),
                autor: article.source?.name || 'Desconocido' 
            }));

            // Transacción para guardar noticias
            const transaction = await ApiNews.sequelize.transaction();
            let savedCount = 0;

            try {
                // Guardar solo noticias únicas por URL
                const results = await Promise.all(
                    newsToSave.map(news => 
                        ApiNews.findOrCreate({
                            where: { url: news.url },
                            defaults: news,
                            transaction
                        })
                    )
                );

                // Contar cuántas noticias nuevas se guardaron
                savedCount = results.filter(([_, created]) => created).length;
                await transaction.commit();
                
                return { 
                    success: true,
                    message: `Se importaron ${savedCount} noticias nuevas de la categoría ${category}`,
                    savedCount,
                    totalFetched: response.data.articles.length
                };
            } catch (dbError) {
                await transaction.rollback();
                throw dbError;
            }
        } catch (error) {
            console.error('Error al obtener noticias de la API:', {
                message: error.message,
                stack: error.stack,
                response: error.response?.data,
                timestamp: new Date().toISOString()
            });
            
            return {
                success: false,
                message: `Error al obtener noticias: ${error.message}`,
                error: error
            };
        }
    }

    /**
     * Obtiene noticias guardadas de la base de datos
     * @param {number} page - Número de página
     * @param {number} limit - Cantidad de noticias por página
     * @param {string} category - Categoría para filtrar (opcional)
     * @returns {Object} Noticias paginadas
     */
    static async getNewsFromDatabase(page = 1, limit = 10, category = null) {
        try {
            const offset = (page - 1) * limit;
            
            // Construimos la condición where según si hay categoría o no
            const whereClause = {};
            if (category) {
                whereClause.fuente = category;
            }
            
            // Incluir la relación con categorías
            const { count, rows } = await ApiNews.findAndCountAll({
                where: whereClause,
                include: [
                    {
                        model: Categorys,
                        as: "categorApi",
                        attributes: ["id", "category_name"]
                    }
                ],
                order: [['fecha_publicacion', 'DESC']],
                limit,
                offset
            });
            
            // Transformar los datos para que tengan un formato uniforme
            const transformedRows = rows.map(row => {
                const plainRow = row.get({ plain: true });
                if (plainRow.categorApi) {
                    plainRow.categoria = plainRow.categorApi.category_name;
                }
                return plainRow;
            });
            
            return {
                success: true,
                data: transformedRows,
                pagination: {
                    total: count,
                    page,
                    limit,
                    totalPages: Math.ceil(count / limit)
                }
            };
        } catch (error) {
            console.error('Error al obtener noticias de la base de datos:', error);
            return {
                success: false,
                message: `Error al obtener noticias: ${error.message}`,
                error
            };
        }
    }

    /**
     * Obtiene las noticias pendientes para aprobación/rechazo
     * @param {number} page - Número de página
     * @param {number} pageSize - Cantidad de noticias por página
     * @returns {Object} Noticias pendientes paginadas
     */
    static async getPendingNews(page = 1, pageSize = 20) {
        try {
            const offset = (page - 1) * pageSize;
            
            const { count, rows } = await ApiNews.findAndCountAll({
                where: { estado: 'pendiente' },
                include: [
                    {
                        model: Categorys,
                        as: "categorApi",
                        attributes: ["id", "category_name"]
                    }
                ],
                order: [['fecha_publicacion', 'DESC']],
                limit: pageSize,
                offset
            });
            
            return {
                success: true,
                data: rows,
                pagination: {
                    total: count,
                    page,
                    pageSize,
                    totalPages: Math.ceil(count / pageSize)
                }
            };
        } catch (error) {
            console.error('Error al obtener noticias pendientes:', error);
            throw error; 
        }
    }

    /**
     * Obtiene estadísticas de las noticias guardadas
     * @returns {Object} Estadísticas de noticias
     */
    static async getNewsStats() {
        try {
            // Total de noticias por estado
            const statusCount = await ApiNews.findAll({
                attributes: [
                    'estado',
                    [ApiNews.sequelize.fn('COUNT', ApiNews.sequelize.col('id')), 'total']
                ],
                group: ['estado']
            });

            // Total de noticias por fuente (top 10)
            const sourceCount = await ApiNews.findAll({
                attributes: [
                    'fuente',
                    [ApiNews.sequelize.fn('COUNT', ApiNews.sequelize.col('id')), 'total']
                ],
                group: ['fuente'],
                order: [[ApiNews.sequelize.literal('total'), 'DESC']],
                limit: 10
            });

            return {
                success: true,
                statusCount,
                sourceCount,
                lastUpdate: new Date()
            };
        } catch (error) {
            console.error('Error al obtener estadísticas de noticias:', error);
            return {
                success: false,
                message: `Error al obtener estadísticas: ${error.message}`,
                error
            };
        }
    }

    /**
     * Actualiza una noticia de API
     * @param {string|number} id - ID de la noticia a actualizar
     * @param {Object} updateData - Datos a actualizar (titulo, contenido, categoria_id, etc.)
     * @returns {Promise<Object>} Resultado de la operación
     */
    static async updateNews(id, updateData) {
        const transaction = await ApiNews.sequelize.transaction();
        try {
            const noticia = await ApiNews.findByPk(id, { transaction });
            
            if (!noticia) {
                await transaction.rollback();
                return { success: false, message: `Noticia no encontrada` };
            }

            // Actualizar la noticia con todos los campos posibles
            await noticia.update({
                titulo: updateData.titulo || noticia.titulo,
                contenido: updateData.contenido || noticia.contenido,
                imagen: updateData.imagen || noticia.imagen,
                categoria_id: updateData.categoria_id || noticia.categoria_id,
                estado: updateData.estado || noticia.estado,
                destacada: updateData.destacada !== undefined ? updateData.destacada : noticia.destacada
            }, { transaction });
            
            await transaction.commit();
            
            // Devolver los datos actualizados
            const updatedNews = await ApiNews.findByPk(id, {
                include: [{ model: Categorys, as: "categorApi" }]
            });
            
            return {
                success: true,
                message: `Noticia actualizada correctamente`,
                data: updatedNews
            };
        } catch (error) {
            await transaction.rollback();
            console.error('Error en updateNews:', error);
            return {
                success: false,
                message: `Error al actualizar la noticia: ${error.message}`
            };
        }
    }

    static async updateNewsStatus(id, estado, categoria_id) {
        const transaction = await ApiNews.sequelize.transaction();
        try {
            const noticia = await ApiNews.findByPk(id, { transaction });
            if(!noticia) { 
                await transaction.rollback();
                return { success: false, message: `Noticia no encontrada` };
            }
            await noticia.update({
                categoria_id: categoria_id || noticia.categoria_id,
                estado: estado || noticia.estado,
            }, { transaction });

            await transaction.commit();

            const updatedNews = await ApiNews.findByPk(id, {
                include: [{ model: Categorys, as: "categorApi" }]
            })

            return {
                success: true,
                message: "Noticia actualizada correctamente",
                data: updatedNews
            }

        } catch(error) {
            await transaction.rollback();
            console.error('Error en updateNews:', error);
            return {
                success: false,
                message: `Error al actualizar la noticia: ${error.message}`
            };
        }
    }

    /**
     * Elimina una noticia de API
     * @param {string|number} id - ID de la noticia a eliminar
     * @returns {Promise<Object>} Resultado de la operación
     */
    static async deleteNews(id) {
        try {
            // Convertir ID a número si es string
            const newsId = typeof id === 'string' ? parseInt(id) : id;
            
            if (isNaN(newsId)) {
                return {
                    success: false,
                    message: `ID de noticia inválido`
                };
            }

            const noticia = await ApiNews.findByPk(newsId);
            
            if (!noticia) {
                return {
                    success: false,
                    message: `No se encontró la noticia con ID ${newsId}`
                };
            }

            await noticia.destroy();
            
            return {
                success: true,
                message: `Noticia eliminada correctamente`
            };
        } catch (error) {
            console.error('Error en deleteNews:', error);
            return {
                success: false,
                message: `Error al eliminar la noticia: ${error.message}`,
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            };
        }
    }
}

export default ApiNewsService;