import { useEffect } from "react";
import "./modalCloseSesion.css";

export const ModalCloseSesionUi = ({ children, modalCloseSesion, closeModal }) => {

  const handleModalContainer = (e) => {
    e.stopPropagation();
  }

  useEffect(() => {
    if ( modalCloseSesion ) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    }

  }, [modalCloseSesion])


  return (
    <article className={ modalCloseSesion ? "modalCS is-open" : "modalCS" } onClick={closeModal}>
      <div className="modal-container-cs" onClick={handleModalContainer}>
        { children }
      </div>
    </article>
  )
}
