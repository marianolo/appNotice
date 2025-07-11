import ApiNews from "../models/ApiNews.js";
import Categorys from "../models/Categorys.js";
import News from "../models/News.js";
import User from "../models/User.js";
import categoryService from "../services/categoryService.js";

class CategoryController {
  // Obtener todas las categorias
  static async getAllCategory() {
    const transaction = await Categorys.sequelize.transaction();
    try {
      const categorys = await Categorys.findAll({
        order: [["id", "ASC"]],
        transaction
      });
      await transaction.commit();
      return categorys;
    } catch (error) {
      await transaction.rollback();
      console.error("Error al obtener Categorias: ", error);
      throw new Error("No se pudo obtener las categorias.")
    }
  }

  // Método para crear Categorias
  static async createCategoria(categorData) {

    const transaction = await Categorys.sequelize.transaction();

    try {

      const Model = Categorys;

      const defaults = {
        category_name: categorData,
      };

      const newCategory = await Model.create(defaults, {transaction});
      await transaction.commit();

      return newCategory;

    } catch (error) {
      console.error("Error al crear la Categoria")
      await transaction.rollback();
      throw error;

    }

  }

  static async updateCategoryName(req, res) {
    try {
      const { id } = req.params;
      const { category_name } = req.body;

      if (!id) {
        return res.status(400).json({
          succes: false,
          message: "ID de categoria no proporcionada"
        })
      }

      const result = await categoryService.updateCategoriaName(id, category_name);

      return res.status(200).json(result);

    } catch(error) {
      console.log(error);
      res.send(error);
    }
  }

  static async countNoticeCateg(page = 1, pageSize = 500, id) {
     try {
          // Obtener noticias locales
          const localNews = await News.findAll({
              where: { categoria_id: id },
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

          // Formatear locales
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

          // Obtener noticias Api
          const apiNews = await ApiNews.findAll({
              where: { categoria_id: id },
              include: [{
                  model: Categorys,
                  as: "categorApi",
                  attributes: ["id", "category_name"]
              }],
              order: [["fecha_publicacion", "DESC"]],
          });

          // Formatear API
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

          // Combinar y ordenar todas, luego aplicar paginacion
          const allNewsOrdered = [...formattedLocalNews, ...formattedApiNews]
          .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

          // Aplicar paginacion
          const paginatedNews = allNewsOrdered.slice((page - 1) * pageSize, page * pageSize);

          // Preparar Respuestas
          const totalItems = allNewsOrdered.length;
          const response = {
              data: paginatedNews,
              meta: {
                  // currentPage: page,
                  // pageSize,
                  // totalLocal: formattedLocalNews.length,
                  // totalApi: formattedApiNews.length,
                  totalItems,
                  // totalPages: Math.ceil(totalItems / pageSize)
              }
          }

          return response;
      } catch (error) {
          console.error('Error al obtener noticias combinadas:', error);
          throw error;
      }
  } 

  // Metodo para eliminar una categoria
  static async deleteCategory(req, res) {

    const { id } = req.params;

    try {
      const cat = await Categorys.findByPk(id);

      if (!cat) {
        return res.status(404).json({ message: "Categoria no encontrada" });
      }

      await cat.destroy();

      return res.status(200).json({ message: "Categoria eliminada exitosamente!" })

    } catch (error) {
      console.error('Error al eliminar categoria:', error);
      return res.status(500).json({ 
          message: 'Error al eliminar la categoria',
          error: error.message 
      });
    }

  }

  static async getByIdAsc() {
    try {
      const categoryAsc = await Categorys.findAll({
        order: [["id", "ASC"]],
      })
      return categoryAsc;
    } catch (error) {
      console.error(error);
      throw new Error("No se pudo obtener las categorias.")
    }
  }

  static async getByIdDesc() {
    try {
      const categoryDesc = await Categorys.findAll({
        order: [["id", "DESC"]],
      });
      return categoryDesc;
    } catch (error) {
      console.error(error);
      throw new Error("No se pudo obtener las categorias.")
    }
  }

  static async getByNameAsc() {
    try {
      const categoryAsc = await Categorys.findAll({
        order: [["category_name", "ASC"]],
      });
      return categoryAsc;

    } catch (error) {
      console.error(error);
      throw new Error("No se Puede obtener las categorias.");
    }
  }

  static async getByNameDesc() {
    try {
      const categoryDesc = await Categorys.findAll({
        order: [["category_name", "DESC"]],
      });
      return categoryDesc;

    } catch (error) {
      console.error(error);
      throw new Error("No se puede obtener las categorias.")
    }
  }


}

export default CategoryController;