import { useEffect, useState } from "react";

export const Filtro = ({noticia}) => {

  const [ isOpen, setIsOpen ] = useState(false);
  const [ viewNotice, setViewNotice ] = useState({})

  const handleOpen = (val) => {
    setIsOpen(true);
    setViewNotice(val);
  }

  const handleClose = () => {
    setIsOpen(false);
  }

  const handleModalContainerClick = (e) => {
    e.stopPropagation();
  }

  useEffect(() => {
    if(isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    }
  }, [isOpen]);
  

  return (
    <>
      {noticia.length === 0 && <p className="empty-message-filtroHome">No se encontraron noticias para mostrar. Prueba a cambiar los filtros de búsqueda.</p>}

      <div className="noticias-container">

          {
            noticia.map((noticia, index) => (
              <div key={`${noticia.id}-${index}`} className="noticia">
                <img 
                  src={noticia.imagen} 
                  alt={noticia.titulo} 
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x200?text=Imagen+no+disponible';
                  }}
                />
                <div className="noticia-content">
                  <h2>{noticia.titulo}</h2>
                  <p>{noticia.categor}</p>
                  <p className="fuente-autor">
                    {noticia.fuente} • {noticia.autor}
                    {noticia.tipo === 'local' && <span className="badge local"></span>}
                    {noticia.tipo === 'api' && <span className="badge api"></span>}
                  </p>
                  <p>
                    {noticia.contenido?.substring(0, 100) + "..." || "Sin descripción disponible"}
                  </p>
                  {
                    noticia.tipo === "local" ?
                    <button onClick={() => handleOpen({
                      "id": noticia.id,
                      "imagen": noticia.imagen,
                      "titulo": noticia.titulo,
                      "categoria": noticia.categor,
                      "fuente": noticia.fuente,
                      "autor": noticia.autor,
                      "tipo": noticia.tipo,
                      "contenido": noticia.contenido,
                    })} className="leer-mas-btn" >Ver Noticia</button> :
                    noticia.tipo === "api" ?
                    <a 
                      href={noticia.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="leer-mas"
                    >
                      Leer más
                    </a> : ""
                  }
                </div>
              </div>
            ))
          }
        <article className={ isOpen ? "modalLocalNew is-open" : "modalLocalNew" } onClick={handleClose}>
          <div className="modal-container-localNew" onClick={handleModalContainerClick}>
          <div className="noticia-modal">
                <a 
                  href={viewNotice.imagen}
                  target="_blank" 
                >
                  <img 
                    src={viewNotice.imagen} 
                    alt={viewNotice.titulo} 
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300x200?text=Imagen+no+disponible';
                    }}                  
                  />
                </a>
                <div className="noticia-content-modal">
                  <h2>{viewNotice.titulo}</h2>
                  <p>{viewNotice.categor}</p>
                  <p className="fuente-autor-modal">
                    {viewNotice.fuente} • {viewNotice.autor}
                    {viewNotice.tipo === 'local' && <span className="badge local"> Local</span>}
                    {viewNotice.tipo === 'api' && <span className="badge api">API</span>}
                  </p>
                  <p>
                    {viewNotice.contenido || "Sin descripción disponible"}
                  </p>
                  <button className="cancel-btn-new" onClick={handleClose}>Cerrar</button>
                </div>
              </div>
          </div>
        </article>
        </div>
    </>
  )
}
