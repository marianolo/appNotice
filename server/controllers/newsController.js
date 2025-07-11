import axios from 'axios';
import ApiNews from '../models/ApiNews.js';
import News from '../models/News.js'; 
import User from '../models/User.js';
import cacheService from '../services/cacheService.js';
import Categorys from '../models/Categorys.js';

class NewsController {
    static async fetchExternalNews() {
        try {
            const response = await axios.get('https://newsapi.org/v2/top-headlines', {
                params: {
                    country: 'ar', 
                    apiKey: process.env.NEWSAPI_KEY,
                    pageSize: 100
                }
            });

            if (!response.data.articles) {
                throw new Error('Formato de respuesta inesperado de NewsAPI');
            }

            const newsToSave = response.data.articles.map(article => ({
                fuente: article.source?.name || 'Desconocida',
                titulo: article.title,
                contenido: article.description || article.content || 'Sin contenido disponible',
                url: article.url,
                imagen: article.urlToImage || 'https://via.placeholder.com/600x400?text=Sin+imagen',
                estado: 'pendiente',
                fecha_publicacion: article.publishedAt || new Date().toISOString(),
                autor: article.author || 'Desconocido',
                categorApi: null
            }));

            const transaction = await ApiNews.sequelize.transaction();
            try {
                const savedCount = await Promise.all(
                    newsToSave.map(news => 
                        ApiNews.findOrCreate({
                            where: { url: news.url },
                            defaults: news,
                            transaction
                        })
                    )
                ).then(results => results.filter(([instance, created]) => created).length);

                await transaction.commit();
                
                return { 
                    message: 'Noticias externas importadas exitosamente',
                    count: savedCount 
                };
            } catch (dbError) {
                await transaction.rollback();
                throw dbError;
            }
        } catch (error) {            
            const localNewsCount = await News.count({ where: { estado: 'publicada' } });
            if (localNewsCount > 0) {
                return {
                    message: 'Usando noticias locales debido a error en API externa',
                    count: localNewsCount
                };
            }
            
            throw new Error('No se pudieron obtener noticias externas y no hay noticias locales disponibles');
        }
    }

    static async getPendingExternalNews(page = 1, pageSize = 20) {
        const cacheKey = `pending_news_page_${page}`;
        
        try {
            try {
                const cachedNews = await cacheService.get(cacheKey);
                if (cachedNews) return JSON.parse(cachedNews);
            } catch (cacheError) {}
            
            const { count, rows } = await ApiNews.findAndCountAll({
                where: { estado: 'pendiente' },
                order: [['fecha_publicacion', 'DESC']],
                limit: pageSize,
                offset: (page - 1) * pageSize
            });
            
            const response = {
                data: rows,
                meta: {
                    currentPage: page,
                    pageSize,
                    totalItems: count,
                    totalPages: Math.ceil(count / pageSize)
                }
            };
            
            if (rows.length > 0) {
                try {
                    await cacheService.set(cacheKey, JSON.stringify(response), 300);
                } catch (cacheError) {}
            }
            
            return response;
        } catch (error) {
            throw error;
        }
    }

    static async updateNewsStatus(ids, estado, categoria_id) {
        const transaction = await ApiNews.sequelize.transaction();
        
        try {
            const validStates = ['pendiente', 'aprobada', 'rechazada'];
            if (!validStates.includes(estado)) {
                throw new Error('Estado no válido');
            }
            
            const updateData = { estado };
            if (categoria_id) {
                updateData.categoria_id = categoria_id;
            }
            
            const [affectedCount] = await ApiNews.update(
                updateData,
                { 
                    where: { id: ids },
                    transaction 
                }
            );
    
            await transaction.commit();
            
            await this.invalidateNewsCaches();
    
            return { affectedCount };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    static async createNews(newsData, userId, isExternal = false) {
        const transaction = await News.sequelize.transaction();
        
        try {
            if (!newsData.titulo || !newsData.contenido) {
                throw new Error('El título y el contenido son obligatorios');
            }
            
            const Model = isExternal ? ApiNews : News;
            const defaults = {
                titulo: newsData.titulo,
                contenido: newsData.contenido,
                fuente: newsData.fuente || (isExternal ? 'Externa' : 'Admin'),
                estado: isExternal ? 'pendiente' : 'publicada',
                imagen: newsData.imagen || 'https://via.placeholder.com/600x400?text=Sin+imagen',
                url: newsData.url || '#',
                fecha_publicacion: newsData.fecha_publicacion || new Date().toISOString(),
                categoria_id: newsData.categoria_id
            };
            
            if (!isExternal) {
                defaults.autor_id = userId;
            } else {
                defaults.autor = newsData.autor || 'Desconocido';
            }
            
            const newNews = await Model.create(defaults, { transaction });
            await transaction.commit();
            
            await this.invalidateNewsCaches();
            
            return newNews;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    static async getLocalPublishedNews(page = 1, pageSize = 10) {        
        try {
            const { count, rows } = await News.findAndCountAll({
                where: { estado: "publicada" },
                include: [
                    {
                        model: User,
                        as: "autor",
                        attributes: ["id", "nombre", "email"]
                    },
                    { 
                        model: Categorys,
                        as: "categor",
                        attributes: ["id", "category_name"]
                    }
                ],
                order: [["createdAt", "DESC"]],
                limit: pageSize,
                offset: (page - 1) * pageSize
            });
            
            const formattedNews = rows.map(item => ({
                id: item.id,
                titulo: item.titulo,
                contenido: item.contenido,
                imagen: item.imagen,
                url: null,
                fuente: "Local",
                autor: item.autor?.nombre || "Admin",
                fecha: item.createdAt,
                tipo: 'local',
                categor: item.categor?.category_name,
            }));
            
            const response = {
                data: formattedNews,
                meta: {
                    currentPage: page,
                    pageSize,
                    totalItems: count,
                    totalPages: Math.ceil(count / pageSize)
                }
            };
            
            return response;
        } catch (error) {
            throw error;
        }
    }

    static async getCombinedPublicNews(page = 1, pageSize = 10, category = null) {        
        try {
            const localWhere = { estado: "publicada" };
            const apiWhere = { estado: "aprobada" };
    
            if (category) {
                localWhere['$categor.category_name$'] = category;
                apiWhere['$categorApi.category_name$'] = category;
            }
    
            const localNews = await News.findAll({
                where: localWhere,
                include: [
                    {
                        model: User,
                        as: "autor",
                        attributes: ["id", "nombre", "email"]
                    },
                    {
                        model: Categorys,
                        as: "categor",
                        attributes: ["id", "category_name"]
                    }
                ],
                order: [["createdAt", "DESC"]]
            });
    
            const formattedLocalNews = localNews.map(item => ({
                id: `local-${item.id}`,
                titulo: item.titulo,
                contenido: item.contenido,
                imagen: item.imagen,
                url: null,
                fuente: "Local",
                autor: item.autor?.nombre || "Admin",
                fecha: item.createdAt,
                tipo: 'local',
                categor: item.categor?.category_name
            }));
    
            const apiNews = await ApiNews.findAll({
                where: apiWhere,
                include: [
                    {
                        model: Categorys,
                        as: "categorApi",
                        attributes: ["id", "category_name"]
                    }
                ],
                order: [["fecha_publicacion", "DESC"]]
            });
    
            const formattedApiNews = apiNews.map(item => ({
                id: `api-${item.id}`,
                titulo: item.titulo,
                contenido: item.contenido,
                imagen: item.imagen,
                url: item.url,
                fuente: item.fuente,
                autor: item.autor || "API",
                fecha: item.fecha_publicacion,
                tipo: 'api',
                categor: item.categorApi?.category_name
            }));
    
            const allNewsOrdered = [...formattedLocalNews, ...formattedApiNews]
                .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
            const paginatedNews = allNewsOrdered.slice((page - 1) * pageSize, page * pageSize);
    
            const totalItems = allNewsOrdered.length;
            const response = {
                data: paginatedNews,
                meta: {
                    currentPage: page,
                    pageSize,
                    totalLocal: formattedLocalNews.length,
                    totalApi: formattedApiNews.length,
                    totalItems,
                    totalPages: Math.ceil(totalItems / pageSize)
                }
            };
    
            return response;
        } catch (error) {
            throw error;
        }
    }

    static async getAllCombinedPublicNews(page = 1, pageSize = 50) {
        try {
            const localNews = await News.findAll({
                where: { estado: "publicada" },
                include: [
                    {
                        model: User,
                        as: "autor",
                        attributes: ["id", "nombre", "email"]
                    },
                    {
                        model: Categorys,
                        as: "categor",
                        attributes: ["id", "category_name"]
                    }
                ],
                order: [["createdAt", "DESC"]]
            });

            const formattedLocalNews = localNews.map(item => ({
                id: `local-${item.id}`,
                titulo: item.titulo,
                contenido: item.contenido,
                imagen: item.imagen,
                url: null,
                fuente: "Local",
                autor: item.autor?.nombre || "Admin",
                fecha: item.createdAt,
                tipo: "local",
                categor: item.categor?.category_name
            }));

            const apiNews = await ApiNews.findAll({
                where: { estado: "aprobada" },
                include: [{
                    model: Categorys,
                    as: "categorApi",
                    attributes: ["id", "category_name"]
                }],
                order: [["fecha_publicacion", "DESC"]]
            });

            const formattedApiNews = apiNews.map(item => ({
                id: `api-${item.id}`,
                titulo: item.titulo,
                contenido: item.contenido,
                imagen: item.imagen,
                url: item.url,
                fuente: item.fuente,
                autor: item.autor || "API",
                fecha: item.fecha_publicacion,
                tipo: "api",
                categor: item.categorApi?.category_name,
            }));

            const allNewsOrdered = [...formattedLocalNews, ...formattedApiNews]
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

            const paginatedNews = allNewsOrdered.slice((page - 1) * pageSize, page * pageSize);

            const totalItems = allNewsOrdered.length;
            const response = {
                data: paginatedNews,
                meta: {
                    currentPage: page,
                    pageSize,
                    totalLocal: formattedLocalNews.length,
                    totalApi: formattedApiNews.length,
                    totalItems,
                    totalPages: Math.ceil(totalItems / pageSize)
                }
            }

            return response;
        } catch (error) {
            throw error;
        }
    }

    static async invalidateNewsCaches() {
        try {
            const keys = await cacheService.keys('*_news*');
            
            if (keys.length > 0) {
                await Promise.all(keys.map(key => cacheService.del(key)));
            }
        } catch (error) {}
    }

    static async getPublishedApiNews(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 6;
            
            const { count, rows } = await ApiNews.findAndCountAll({
                where: { estado: 'aprobada' },
                order: [['fecha_publicacion', 'DESC']],
                limit,
                offset: (page - 1) * limit
            });
            
            return res.status(200).json({
                data: rows,
                meta: {
                    currentPage: page,
                    pageSize: limit,
                    totalItems: count,
                    totalPages: Math.ceil(count / limit)
                }
            });
        } catch (error) {
            return res.status(500).json({ 
                message: 'Error al obtener noticias publicadas',
                error: error.message 
            });
        }
    }

    static async updateApiNews(req, res) {
        const { id } = req.params;
        const { titulo, contenido, categoria, imagen } = req.body;
        
        if (!titulo || !contenido) {
            return res.status(400).json({ message: 'El título y contenido son campos obligatorios' });
        }
        
        try {
            const news = await ApiNews.findByPk(id);
            
            if (!news) {
                return res.status(404).json({ message: 'Noticia no encontrada' });
            }
            
            await news.update({
                titulo,
                contenido,
                categoria,
                imagen: imagen || news.imagen
            });
            
            await NewsController.invalidateNewsCaches();
            
            return res.status(200).json({ 
                message: 'Noticia actualizada exitosamente',
                data: news
            });
        } catch (error) {
            return res.status(500).json({ 
                message: 'Error al actualizar la noticia',
                error: error.message 
            });
        }
    }

    static async deleteApiNews(req, res) {
        const { id } = req.params;
        
        try {
            const news = await ApiNews.findByPk(id);
            
            if (!news) {
                return res.status(404).json({ message: 'Noticia no encontrada' });
            }
            
            await news.destroy();
            
            await NewsController.invalidateNewsCaches();
            
            return res.status(200).json({ message: 'Noticia eliminada exitosamente' });
        } catch (error) {
            return res.status(500).json({ 
                message: 'Error al eliminar la noticia',
                error: error.message 
            });
        }
    }

    static async getLocalNewsById(req, res) {
        const { id } = req.params;
        
        try {
            const news = await News.findByPk(id, {
                include: [{
                    model: User,
                    as: "autor",
                    attributes: ["id", "nombre", "email"]
                }]
            });
            
            if (!news) {
                return res.status(404).json({ message: 'Noticia no encontrada' });
            }
            
            return res.status(200).json(news);
        } catch (error) {
            return res.status(500).json({ 
                message: 'Error al obtener la noticia',
                error: error.message 
            });
        }
    }

    static async updateLocalNews(req, res) {
        const { id } = req.params;
        const { titulo, contenido, categoria_id, imagen } = req.body;
        
        if (!titulo || !contenido) {
            return res.status(400).json({ message: 'El título y contenido son campos obligatorios' });
        }
        
        try {
            const news = await News.findByPk(id);
            
            if (!news) {
                return res.status(404).json({ message: 'Noticia no encontrada' });
            }
            
            await news.update({
                titulo,
                contenido,
                categoria_id,
                imagen: imagen || news.imagen
            });
            
            await NewsController.invalidateNewsCaches();
            
            return res.status(200).json({ 
                message: 'Noticia actualizada exitosamente',
                data: news
            });
        } catch (error) {
            return res.status(500).json({ 
                message: 'Error al actualizar la noticia',
                error: error.message 
            });
        }
    }

    static async deleteLocalNews(req, res) {
        const { id } = req.params;
        
        try {
            const news = await News.findByPk(id);
            
            if (!news) {
                return res.status(404).json({ message: 'Noticia no encontrada' });
            }
            
            await news.destroy();
            
            await NewsController.invalidateNewsCaches();
            
            return res.status(200).json({ message: 'Noticia eliminada exitosamente' });
        } catch (error) {
            return res.status(500).json({ 
                message: 'Error al eliminar la noticia',
                error: error.message 
            });
        }
    }

    static async getPublicNews(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const pageSize = parseInt(req.query.pageSize) || 6;
            
            const response = await NewsController.getCombinedPublicNews(page, pageSize);
            return res.status(200).json(response);
        } catch (error) {
            return res.status(500).json({ 
                message: 'Error al obtener noticias públicas',
                error: error.message 
            });
        }
    }
}

export default NewsController;