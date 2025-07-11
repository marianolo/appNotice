import { MdDelete } from "react-icons/md";
import { MdEdit } from "react-icons/md";
import { TiArrowSortedDown } from "react-icons/ti";
import { TiArrowSortedUp } from "react-icons/ti";
import { TiArrowUnsorted } from "react-icons/ti";

export const CategoryUpdateDelete = ({ almacenCategoria, categoryEdit, categoryDelete, getIdCatOrder, getNameCatOrder }) => {

  return (
    <>
    <div className="tableUpdateDelete">

      <table>
        <thead>
          <tr>
            <th onClick={getIdCatOrder} className="categoriaOrderId" title="Ordenar por ID" scope="col"><TiArrowUnsorted /> #</th>
            <th onClick={getNameCatOrder} className="categoriaOrderId" title="Ordenar por Nombre" scope="col"><TiArrowUnsorted /> Categoría</th>
            <th scope="col">Acción</th>
          </tr>
        </thead>
        <tbody>        
        {
          almacenCategoria.map((val, key) => {
            return <tr key={key}>
              <th>{val.id}</th>
              <td>{val.category_name}</td>
              <td>
                <button
                  onClick={() => {categoryEdit(val)}}
                  className="edit"
                  title="Editar"
                >
                  <MdEdit />
                </button>
                <button
                  onClick={() => {categoryDelete(val)}}
                  className="del"
                  title="Eliminar"
                >
                  <MdDelete />
                </button>
              </td>
            </tr>  
          })
        }
        </tbody>
      </table>
    </div>
    </>
  )
}
