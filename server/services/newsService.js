import axios from 'axios';
import ApiNews from '../models/ApiNews.js';
import News from '../models/News.js';
import User from '../models/User.js';
import { Op } from 'sequelize';

class NewsService {
    // Servicio para obtener noticias con filtros avanzados
    static async getFilteredNews(filters = {}) {
        const {
            source,
            status,
            startDate,
            endDate,
            author,
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'DESC'
        } = filters;

        try {
            // Construir condiciones de filtro
            const whereConditions = {};

            if (source) {
                whereConditions.fuente = { [Op.like]: `%${source}%` };
            }

            if (status) {
                whereConditions.estado = status;
            }

            if (startDate && endDate) {
                whereConditions.createdAt = {
                    [Op.between]: [new Date(startDate), new Date(endDate)]
                };
            }

            // Buscar noticias con condiciones y paginación
            const { count, rows: news } = await News.findAndCountAll({
                where: whereConditions,
                include: [
                    {
                        model: User,
                        attributes: ['id', 'nombre'],
                        where: author ? { nombre: { [Op.like]: `%${author}%` } } : {}
                    }
                ],
                order: [[sortBy, sortOrder]],
                limit: Number(limit),
                offset: (page - 1) * limit
            });

            return {
                total: count,
                page: Number(page),
                totalPages: Math.ceil(count / limit),
                news
            };
        } catch (error) {
            throw new Error(`Error al obtener noticias: ${error.message}`);
        }
    }

    // Servicio para analizar tendencias de noticias
    static async getNewsTrends() {
        try {
            // Análisis de noticias por fuente
            const sourceStats = await News.findAll({
                attributes: [
                    'fuente',
                    [ApiNews.sequelize.fn('COUNT', ApiNews.sequelize.col('id')), 'total_noticias']
                ],
                group: ['fuente'],
                order: [[ApiNews.sequelize.col('total_noticias'), 'DESC']]
            });

            // Análisis de estado de noticias
            const statusStats = await News.findAll({
                attributes: [
                    'estado',
                    [ApiNews.sequelize.fn('COUNT', ApiNews.sequelize.col('id')), 'total_noticias']
                ],
                group: ['estado']
            });

            // Tendencias temporales
            const monthlyTrends = await News.findAll({
                attributes: [
                    [ApiNews.sequelize.fn('MONTH', ApiNews.sequelize.col('createdAt')), 'mes'],
                    [ApiNews.sequelize.fn('COUNT', ApiNews.sequelize.col('id')), 'total_noticias']
                ],
                group: ['mes'],
                order: [[ApiNews.sequelize.col('mes'), 'ASC']]
            });

            return {
                sourceStats,
                statusStats,
                monthlyTrends
            };
        } catch (error) {
            throw new Error(`Error al obtener tendencias de noticias: ${error.message}`);
        }
    }

    // Servicio para generar recomendaciones de noticias
    static async getNewsRecommendations(userId) {
        try {
            // Obtener las categorías de noticias más leídas por el usuario
            const userPreferences = await News.findAll({
                attributes: [
                    'fuente',
                    [ApiNews.sequelize.fn('COUNT', ApiNews.sequelize.col('id')), 'total_noticias']
                ],
                where: { autor_id: userId },
                group: ['fuente'],
                order: [[ApiNews.sequelize.col('total_noticias'), 'DESC']],
                limit: 3
            });

            // Si no hay preferencias, devolver noticias recientes
            if (userPreferences.length === 0) {
                return this.getFilteredNews({ 
                    limit: 10, 
                    sortBy: 'createdAt' 
                });
            }

            // Buscar noticias basadas en las preferencias del usuario
            const recommendedNews = await News.findAll({
                where: {
                    fuente: {
                        [Op.in]: userPreferences.map(pref => pref.fuente)
                    },
                    autor_id: { [Op.ne]: userId }
                },
                limit: 10,
                order: [['createdAt', 'DESC']]
            });

            return recommendedNews;
        } catch (error) {
            throw new Error(`Error al generar recomendaciones: ${error.message}`);
        }
    }

    // Servicio para exportar noticias
    static async exportNews(filters = {}) {
        try {
            const news = await this.getFilteredNews(filters);
            
            // Convertir a CSV
            const convertToCSV = (data) => {
                const headers = ['ID', 'Título', 'Fuente', 'Estado', 'Autor', 'Fecha'];
                const csvRows = data.map(item => [
                    item.id,
                    `"${item.titulo.replace(/"/g, '""')}"`,
                    item.fuente,
                    item.estado,
                    item.User.nombre,
                    item.createdAt
                ]);

                return [
                    headers.join(','),
                    ...csvRows.map(row => row.join(','))
                ].join('\n');
            };

            return {
                filename: `news_export_${new Date().toISOString().split('T')[0]}.csv`,
                content: convertToCSV(news.news)
            };
        } catch (error) {
            throw new Error(`Error al exportar noticias: ${error.message}`);
        }
    }
}

export default NewsService;