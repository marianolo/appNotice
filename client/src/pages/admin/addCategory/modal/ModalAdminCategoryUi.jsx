import { useEffect } from "react";
import "./modalAdminCategory.css";

export const ModalAdminCategoryUi = ({ children, edit, del, handleClose }) => {

  const handleModalContainerClick = (e) => {
    e.stopPropagation();
  }

  useEffect(() => {
    if(edit || del) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    }
  }, [edit || del]);


  return (
    <article className={ edit || del ? "modalCat is-open" : "modalCat" } onClick={handleClose} >
      <div className="modal-container-cat" onClick={handleModalContainerClick}>
        { children }
      </div>
    </article>
  )
}
