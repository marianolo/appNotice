import express from "express";
import CategoryController from "../controllers/categoryController.js";
import { authenticateUser as authMiddleware, isAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Obtener todas las categorias
router.get("/", async (req, res) => {
  try {
    const categorys = await CategoryController.getAllCategory();
    res.status(200).json(categorys);
      
  } catch (error) {
    res.status(500).json({
      message: "error al obtener categorias",
      error: error.message,
    })
  }
});


// Crear nueva categoria
router.post("/categPost", authMiddleware, async (req, res) => {
  try {
    const categorData = req.body.categoriaCreada;
    // console.log(categorData)
    const newCategory = await CategoryController.createCategoria(categorData);

    res.status(201).json(newCategory);

  } catch (error) {
    console.error("Error al crear Categoria"  );
    res.send(error) 
  }
})

// Actualizar categoria
router.put("/:id/categPut", authMiddleware, CategoryController.updateCategoryName);

// Conseguir cantidad de noticias para cada categoria
router.get("/:id/countNoticeCat", async(req, res) => {

  const { id } = req.params;

  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 500;
    const countNotiCat = await CategoryController.countNoticeCateg(page, pageSize, id);
    res.status(200).json(countNotiCat);
  } catch (error) {
    res.status(500).json({
      message: "error al obtener numero de noticias",
      error: error.message,
    })
  }
})

router.delete("/catDel/:id", authMiddleware, CategoryController.deleteCategory);

router.get("/getByIdAsc", async(req, res) => {
  try {
    const getId = await CategoryController.getByIdAsc();
    res.status(200).json(getId);
  } catch (error) {
    res.status(500).json({
    message: "error al obtener categorias",
    error: error.message,
    })
  }

});

router.get("/getByIdDesc", async(req, res) => {
  try {
    const getId = await CategoryController.getByIdDesc();
    res.status(200).json(getId);
  } catch (error) {
      res.status(500).json({
      message: "error al obtener categorias",
      error: error.message,
    })
  }

});

router.get("/getByNameAsc", async(req, res) => {
  try {
    const getName = await CategoryController.getByNameAsc();
    res.status(200).json(getName);

  } catch(error) {
    res.status(500).json({
      message: "Error al obtener categorias",
      error: error.message,
    })
  }
})

router.get("/getByNameDesc", async(req, res) => {
  try {
    const getName = await CategoryController.getByNameDesc();
    res.status(200).json(getName);

  } catch (error) {
    res.status(500).json({
      message: "Error al obtener categorias",
      error: error.message,
    })
  }
})


export default router;