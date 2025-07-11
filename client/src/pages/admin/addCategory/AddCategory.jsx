import { useEffect, useState } from "react"
import "./addCategory.css"
import axios from "axios";
import { CategoryEdit, CategoryUpdateDelete } from "./CategoryUpdateDelete";
import { ModalAdminCategory } from "./modal/ModalAdminCategory";
import { useCategoryOrder } from "./useCategoryOrder";

export const AddCategory = () => {

  // Variable de secciones
  const [ activeTab, setActiveTab ] = useState("create");
  
  // Variable para almacenar categorias de db
  const [ almacenCategoria, setAlmacenCategoria ] = useState([]);

  // Variable para almacenar noticas combinadas de db 
  const [ almacenNoticia, setAlmacenNoticia ] = useState([]);

  // Variable para creacion de categoria
  const [ categorCreate, setCategorCreate ] = useState({
    categoriaCreada: "",
  });

  // Variable para activar edicion
  const [ edit, setEdit ] = useState(false);

  // Variable para activar eliminacion
  const [ del, setDel ] = useState(false);

  // Variables que guardan datos de categoria para editar o eliminar
  const [ catId, setCatId ] = useState(null);
  const [ catName, setCatName ] = useState(null);

  // Variable para edicion de categoria
  const [ categoriaToEdit, setCategoriaToEdit ] = useState({
    categoriaEditada: "",
  });

  // Variable notificadora de creacion de categoria
  const [ formSuccess, setFormSuccess ] = useState(null);
  const [ formError, setFormError ] = useState(null);
  const [ formErrorModal, setFormErrorModal ] = useState(null)

  // Variable encargada de generar GET de manera ASC o DESC por Nombre o ID
  const [ getIdCat, setGetIdCat ] = useState(false);
  const [ getNameCat, setGetNameCat ] = useState(false);


  // Custom Hook useCategoryOrder
  const {
    orderId,
    orderName,
    setOrderId,
    setOrderName,
    setPriority,
  } = useCategoryOrder({

  })


  // -------- GET ----------
  // Obtener y almacenar categorias
  const getCategory = () => {
    try {
      axios.get("http://localhost:5000/api/category").then((response) => {
        setAlmacenCategoria(response.data)
      })

    } catch (error) {
      alert(error)
    }
  }

  const getNoticia = (val) => {
    try {
      axios.get(`http://localhost:5000/api/category/${val.id}/countNoticeCat`,
        catId,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      ).then((response) => {
        setAlmacenNoticia(response.data.data.length);
      })
    } catch (error) {
      alert(error);
    }
  }
  
  // -------- CREATE ----------
  // Crear una nueva categoria

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCategorCreate({
      ...categorCreate,
      [name]: value
    });
  }

  const postCategory = (e) => {
    e.preventDefault();

    try {
      if (!categorCreate.categoriaCreada.trim()) {
        setFormError("Por favor, Ingresá una categoria!");
        setTimeout(() => setFormError(null), 3000);
        return;
      }

      if (categorCreate.categoriaCreada.length > 23) {
        setFormError("La categoria ingresada es demasiado larga!");
        setTimeout(() => setFormError(null), 3000);
        return;
      }
      const token = localStorage.getItem("token");
      axios.post("http://localhost:5000/api/category/categPost", categorCreate, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }).then((response) => {
        if (response.data.name === "SequelizeUniqueConstraintError") {
          setFormError("La categoria ingresada ya existe");
          setTimeout(() => setFormError(null), 3000);
        } else {
          // Limpiar formulario de categorias
          setCategorCreate({
            categoriaCreada: ""
          });
    
          setFormSuccess(`Categoria "${categorCreate.categoriaCreada}" Creada Correctamente.`)
          setTimeout(() => setFormSuccess(null), 3000);
        }
      }).catch((error) => {
        setFormError(error.response.data.message)
        setTimeout(() => setFormError(null), 3000);
        return;
      });

      
    } catch (error) {
      alert(error)
    }

  }
  
  // -------- UPDATE ----------
  // Actualizar una categoria existente
  
  // Metodo para invocar categoria para editar
  const categoryEdit = (val) => {
    setEdit(true);
    setCatId(val.id);
    setCatName(val.category_name);
  }

  const handleChangeEdit = (e) => {
    const { name, value } = e.target;
    setCategoriaToEdit({
      ...categoriaToEdit,
      [name]: value,
    })
  }

  // Metodo para realizar actualización de edicion
  const putCategory = async (e) => {
    e.preventDefault();
    
    const payload = {
      category_name: categoriaToEdit.categoriaEditada,
    }

    try {
      if (!categoriaToEdit.categoriaEditada.trim()) {
        setFormErrorModal("Por favor, Ingresá una categoria!");
        setTimeout(() => setFormErrorModal(null), 3000);
        return;
      }

       if (categoriaToEdit.categoriaEditada.length > 23) {
        setFormErrorModal("La categoria ingresada es demasiado larga!");
        setTimeout(() => setFormErrorModal(null), 3000);
        return;
      }

      await axios.put(`http://localhost:5000/api/category/${catId}/categPut`, 
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      ).then((response) => {        
        if (response.data.message === "Error al actualizar categoria") {
          setFormErrorModal("La categoria ingresada ya existe!");
          setTimeout(() => setFormErrorModal(null), 3000);
          return;
        } 
        handleClose();
        setFormSuccess(`Categoria "${catName}" Renombrada a "${categoriaToEdit.categoriaEditada}"`)
        setTimeout(() => setFormSuccess(null), 3000);
      });

    } catch (error) {
      setFormError(error.response.data.message)
      setTimeout(() => setFormError(null), 3000);
      handleClose();
      return;
    }

  }

  // -------- DELETE ----------
  // Eliminar una categoria existente

  const categoryDelete = (val) => {
    setDel(true);
    setCatId(val.id);
    setCatName(val.category_name);
    getNoticia(val);
  }

  // Metodo para eliminar categoria existente
  const delCategory = async() => {

    try {
      await axios.delete(`http://localhost:5000/api/category/catDel/${catId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      handleClose();
      setFormSuccess(`Categoria "${catName}" Eliminada permanentemente`)
      setTimeout(() => setFormSuccess(null), 3000);
      
    } catch(error) {
      setFormError(error.response.data.message)
      setTimeout(() => setFormError(null), 3000);
      handleClose();
      return;
    }
  }

  // -------- GET Avanzado ----------
  // Metodo get para traer tabla de categorias por nombre ASC o DESC

  // get por id descendente
  const getIdEffectDesc = () => {
    try {  
      axios.get("http://localhost:5000/api/category/getByIdDesc").then((response) => {
        setAlmacenCategoria(response.data);
      })
    } catch (error) {
      alert(error);
    }
  }
    
  // get por id ascendente
  const getIdEffectAsc = () => {
    try {
      axios.get("http://localhost:5000/api/category/getByIdAsc").then((response) => {
      setAlmacenCategoria(response.data);
    })
    } catch (error) {
      alert(error);
    }
  }

  // funcion get que cuando se activa, internamente cambia el valor booleano de orderId
  const getIdCatOrder = () => {
    setPriority("id");
    setOrderId(!orderId);
    if (!orderId) {
      setOrderName(false);
      getIdEffectDesc();
    } else {
      setOrderName(false);
      getIdEffectAsc();
    }
  }

  // get por nombre descendente
  const getNameEffectDesc = () => {
    try {
      axios.get("http://localhost:5000/api/category/getByNameDesc").then((response) => {
        setAlmacenCategoria(response.data);
      })
    } catch (error) {
      alert(error);
    }
  }

  // get por nombre ascendente
  const getNameEffectAsc = () => {
    try {
      axios.get("http://localhost:5000/api/category/getByNameAsc").then((response) => {
        setAlmacenCategoria(response.data);
      })
    } catch (error) {
      alert(error);
    }
  }

  // funcion get que cuando se activa, internamente cambia el valor booleano de orderName
  const getNameCatOrder = () => {
    setPriority("name");
    setOrderName(!orderName);
    if(orderName) {
      setOrderId(true)
      getNameEffectDesc();
    } else {
      setOrderId(true)
      getNameEffectAsc();
    }
  }

  // Funcion encargada de limpiar form y cerrar modal
  const handleClose = () => {
    setEdit(false);
    setDel(false);
    setCatId(null);
    setCatName(null);
    setCategoriaToEdit({
      categoriaEditada: ""
    });
  }


  // useEffect avanzado para obtener categorias segun la prioridad de orden seleccionado
  // extrayendo datos previamente guardados en localStorage
  useEffect(() => {

    if ( localStorage.getItem("priority") === "null" ) {
      localStorage.setItem("priority", "id")
    }

    if ( localStorage.getItem("priority") === "id" ) {
      if ( JSON.parse(localStorage.getItem("orderId")) === true ) {
        getIdEffectDesc();
      } else {
        getIdEffectAsc();
      }
    }

    if ( localStorage.getItem("priority") === "name" ) {
      if ( JSON.parse(localStorage.getItem("orderName")) === true ) {
        getNameEffectAsc();
      } else {
        getNameEffectDesc();
      }
    } 

  }, [formSuccess]);


  return (
    <div className="edit-category-container">
      <h1>Gestión de Categorías</h1>

      {/* Secciones para administrar categorias */}
      <div className="seccion">
        <button
          className={activeTab === "create" ? "active" : ""}
          onClick={() => { setActiveTab("create") }}
        >
          Crear Categoría
        </button>
        
        <button
          className={activeTab === "readUpdate" ? "active" : ""}
          onClick={() => { setActiveTab("readUpdate") }}
        >
          Administrar Categorías
        </button>
      </div>

      {formSuccess && <p className="success-category">{formSuccess}</p>}
      {formError && <p className="error-category">{formError}</p>}

      <ModalAdminCategory 
        edit={edit}
        del={del}
        catName={catName}
        handleChangeEdit={handleChangeEdit}
        putCategory={putCategory}
        handleClose={handleClose}
        formErrorModal={formErrorModal}
        almacenNoticia={almacenNoticia}
        delCategory={delCategory}
      />

      {
        activeTab === "create" ?
        <form onSubmit={postCategory}>
          <div className="creacionContainer">
            <div className="creacion">
              <p>Ingresa el nombre de una nueva categoría</p>
              <input 
                onChange={handleChange}
                type="text" 
                placeholder="Categoría..." 
                name="categoriaCreada"
                value={categorCreate.categoriaCreada}
              />
              <button type="submit">Crear Categoría</button>
            </div>
          </div> 
        </form> :

        activeTab === "readUpdate" ?
        <div className="updateDelete">
          <CategoryUpdateDelete
            almacenCategoria={almacenCategoria}
            categoryEdit={categoryEdit}
            categoryDelete={categoryDelete}
            getIdCatOrder={getIdCatOrder}
            getNameCatOrder={getNameCatOrder}
          />
        </div> : ""

      }



    </div>
  )
}
