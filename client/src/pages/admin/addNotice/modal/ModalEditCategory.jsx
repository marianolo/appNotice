import { ModalEditCategoryUi } from "./ModalEditCategoryUi";

export const ModalEditCategory = ({ 
  edit, 
  setEdit, 
  idExtract, 
  setIdExtract, 
  categoria,
  handleStatusChange,
  updateNotice,
  setUpdateNotice,
  formError,
}) => {

  // Manejar cambios en el selector de categorias para noticas extraidas de apis
  const handleInputChangeCat = (e) => {
    const { name, value } = e.target;
    setUpdateNotice({
      ...updateNotice,
      [name]: value
    });
  };

  // Funcion que regresa el estado de edit a falso, cerrando la ventana modal
  const handleClose = () => {
    setEdit(false);
    setIdExtract({});
    setUpdateNotice({
      categoria_id: ""
    });
  };

  return (
    <ModalEditCategoryUi 
      edit={edit} 
      handleClose={handleClose}
    >
      <div className="modal-content">
        {idExtract.imagen && (
          <div className="modal-image">
            <img 
              src={idExtract.imagen} 
              alt={idExtract.titulo}
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/300x200?text=Imagen+no+disponible';
              }} 
            />
          </div>
        )}

        <div className="modal-text">
          <h3>{idExtract.titulo}</h3>
          <p><strong>Fuente:</strong> {idExtract.fuente}</p>
          <p className="modal-content-text">{idExtract.contenido}</p>
          {idExtract.url && (
            <a href={idExtract.url} target="_blank" rel="noopener noreferrer" className="original-link">
              Ver noticia original
            </a>
          )}
        </div>
      </div>

      <div className="modal-category-section">

        {formError && <p className="form-error">{formError}</p>}

      {/* Funcion map para mostrar todas las categorias */}
        <div className="form-group-modal">
          <select 
            name="categoria_id" 
            id="categoria_id"
            onChange={handleInputChangeCat}
            value={updateNotice.categoria_id}
          >
            <option value={""}>Seleccione una categoría</option>
            {
              categoria.map((val, key) =>  {
                return <option key={key} value={val.id}>{val.category_name}</option>
              })
            }
          </select>
        </div>

        <div className="modal-actions">
          <button onClick={() => handleStatusChange(idExtract.id, "aprobada", updateNotice.categoria_id)} className="approve-btn-modal">Aprobar</button>
          <button onClick={handleClose} className="cancel-btn-modal">Cancelar</button>
        </div>
      </div>
    </ModalEditCategoryUi>
  );
};
