import { useEffect } from "react";
import "./modalEditCategory.css";

export const ModalEditCategoryUi = ({ children, edit, handleClose }) => {

  // Funcion que detiene la propagacion del area donde puedo hacer click para cerrar ventana modal
  // Es decir, gracias a esta funcion, puedo hacer click afuera de la ventana para salir, y si hago click dentro, se mantiene abierta
  const handleModalContainerClick = (e) => {
    e.stopPropagation();
  }

  // Efecto responsable de deshabilitar scroll al momento de tener una ventana modal activa
  useEffect(() => {
    if (edit) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    }
  }, [edit]);

  return (
    <article className={ edit ? "modal is-open" : "modal" } onClick={handleClose}>
      <div className="modal-container" onClick={handleModalContainerClick}>
        { children }
        {/* <button className="modal-btn" onClick={handleClose}>Cancelar</button> */}
      </div>
    </article>
  )
}
