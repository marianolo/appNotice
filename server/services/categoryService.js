import Categorys from "../models/Categorys.js";

class categoryService {
  static async updateCategoriaName(id, category_name) {
    try {
      // Buscar categoria
      const categoria = await Categorys.findByPk(id);

      if (!categoria) {
        return {
          success: false,
          message: `No se encontró la categoria con la ID ${id}`
        }
      }

      categoria.category_name = category_name;

      await categoria.save();

      return {
        success: true,
        message: `Categoria actualizada con exito!`
      }

    } catch (error) {
      console.error(error)
      // throw error;
      return {
        success: false,
        message: `Error al actualizar categoria`
      }
    }

  }


}

export default categoryService;