import { Link } from "react-router-dom"
import { ModalAdminCategoryUi } from "./ModalAdminCategoryUi"


export const ModalAdminCategory = ({
  edit,
  del,
  catName,
  handleChangeEdit,
  putCategory,
  handleClose,
  formErrorModal,
  almacenNoticia,
  delCategory,
}) => {

  return (
    <ModalAdminCategoryUi
      edit={edit}
      del={del}
      handleClose={handleClose}
    >
      {
        edit && <form onSubmit={putCategory}>
          <h2 className="modalTitle">Estas a punto de modificar categoria: "<b className="editB">{catName}</b>"</h2>
          {formErrorModal && <p className="error-category-modal">{formErrorModal}</p>}
          <input name="categoriaEditada" onChange={handleChangeEdit} className="modalInputEdit" type="text" placeholder={catName} />
          <div className="modalButtons">
            <button type="submit" className="approve-btn-modal">Aceptar</button>
            <button type="button" onClick={handleClose} className="cancel-btn-modal">Cancelar</button>
          </div>
        </form>
      }

      {
        del && <>
        {
          almacenNoticia > 0 ?
          <>
            <h2 className="advertencia"><b className="delB">¡Advertencia!</b></h2>
            <h2 className="modalTitle">Esta categoria está siendo referida en "<b className="delB">{almacenNoticia}</b>" noticias, por lo tanto no es posible eliminar la categoria "<b className="delB">{catName}</b>"</h2>
            <h2>De lo contrario, para poder eliminar esta categoria "<b className="delB">{catName}</b>", es necesario borrar las noticias relacionadas a ella.</h2>
            <div className="modalButtons">
              <button className="approve-btn-modal"><Link to="/admin/edit-notice">Gestionar Noticias</Link></button>
              <button onClick={handleClose} className="cancel-btn-modal">Volver</button>
            </div>
          </> 
          : 
          <>
            <h2 className="advertencia"><b className="delB">¡Advertencia!</b></h2>
            <h2 className="modalTitle">Estas a punto de eliminar la categoria: "<b className="delB">{catName}</b>"</h2>
            <h2>Esta acción no se podrá revertir.</h2>
            <div className="modalButtons">
              <button onClick={delCategory} className="approve-btn-modal">Eliminar</button>
              <button onClick={handleClose} className="cancel-btn-modal">Cancelar</button>
            </div>
          </> 

        }
        </>
      }
    </ModalAdminCategoryUi>
  )
}
