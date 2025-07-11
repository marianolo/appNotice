import { ModalCloseSesionUi } from "./ModalCloseSesionUi"

export const ModalCloseSesion = ({ 
  modalCloseSesion,
  setModalCloseSesion,
  closeModal,
  nombreUser,
  handleLogout,
 }) => {

  const killSesion = () => {
    closeModal();
    localStorage.clear("user");
  }


  return (
    <ModalCloseSesionUi 
      modalCloseSesion={modalCloseSesion}
      closeModal={closeModal}
    >

      <h2>¡{nombreUser}, estás a punto de cerrar sesión!</h2>
      <div className="cerrarSesion">
        <button className="closeModal" onClick={handleLogout}>Si, Cerrar Sesion</button>
        <button className="killSesion" onClick={closeModal}>Cancelar</button>
      </div>


    </ModalCloseSesionUi>
  )
}
