import { useEffect, useState } from "react";
import axios from "axios";
import { HomeLayout } from "../../layout/HomeLayout";
import "./home.css";
import logoVite from "../../vite.png";

export const HomePage = () => {
  const [noticias, setNoticias] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [viewNotice, setViewNotice] = useState({});
  
  // Estados para la paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalNoticias, setTotalNoticias] = useState(0);
  const noticiasPerPage = 10;

  const obtenerNoticias = async (pagina = paginaActual, forceUpdate = false) => {
    setCargando(true);
    setError(null);

    try {      
      const timestamp = forceUpdate ? `&timestamp=${new Date().getTime()}` : '';
      const respuestaLocal = await axios.get(`http://localhost:5000/api/news/public?page=${pagina}&limit=${noticiasPerPage}${timestamp}`);

      if (respuestaLocal.data && respuestaLocal.data.data && respuestaLocal.data.data.length > 0) {        
        const noticiasFormateadas = respuestaLocal.data.data.map(item => ({
          id: item.id,
          titulo: item.titulo,
          contenido: item.contenido,
          imagen: item.imagen || 'https://via.placeholder.com/300x200?text=Sin+imagen',
          url: item.url || '#',
          fuente: item.fuente || 'Local',
          autor: item.autor || 'Desconocido',
          fecha: item.fecha || new Date().toISOString(),
          tipo: item.tipo,
          categor: item.categor || null,
          fechaCreacion: item.created_at || item.fecha || new Date().toISOString(),
          fechaAprobacion: item.approved_at || null,
        }));

        const noticiasOrdenadas = noticiasFormateadas.sort((a, b) => {
          const fechaA = new Date(a.fechaAprobacion || a.fechaCreacion || a.fecha);
          const fechaB = new Date(b.fechaAprobacion || b.fechaCreacion || b.fecha);
          return fechaB - fechaA;
        });

        setNoticias(noticiasOrdenadas);
        
        if (respuestaLocal.data.meta) {
          setTotalPaginas(respuestaLocal.data.meta.totalPages);
          setTotalNoticias(respuestaLocal.data.meta.totalItems);
        }
        
        setLastUpdate(new Date());
        return;
      }

      throw new Error("No hay noticias disponibles en el servidor local");

    } catch (error) {
      console.error("Error al obtener noticias:", error);
      if (error.response) {
        console.error("Detalles de la respuesta:", error.response.data);
        console.error("Código de estado:", error.response.status);
      }
      setError("No se pudieron cargar las noticias. Por favor, intenta de nuevo más tarde.");
    } finally {
      setCargando(false);
    }
  };

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
      obtenerNoticias(nuevaPagina, true);
    }
  };

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

  useEffect(() => {
    obtenerNoticias(paginaActual);
    
    const intervalo = setInterval(() => {
      obtenerNoticias(paginaActual, true);
    }, 30000);

    const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/png';
    link.rel = 'icon';
    link.href = logoVite;
    document.head.appendChild(link);

    return () => {
      clearInterval(intervalo);
    };
  }, [paginaActual]);

  // Función para formatear la fecha de manera legible
  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    const fechaObj = new Date(fecha);
    const ahora = new Date();
    const diferencia = ahora - fechaObj;
    const minutos = Math.floor(diferencia / 60000);
    const horas = Math.floor(diferencia / 3600000);
    const dias = Math.floor(diferencia / 86400000);

    if (minutos < 60) {
      return `hace ${minutos} minuto${minutos !== 1 ? 's' : ''}`;
    } else if (horas < 24) {
      return `hace ${horas} hora${horas !== 1 ? 's' : ''}`;
    } else if (dias < 7) {
      return `hace ${dias} día${dias !== 1 ? 's' : ''}`;
    } else {
      return fechaObj.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: fechaObj.getFullYear() !== ahora.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const renderPaginacion = () => {
    if (totalPaginas <= 1) return null;
    
    return (
      <div className="paginacion">
        <button 
          onClick={() => cambiarPagina(paginaActual - 1)} 
          disabled={paginaActual === 1 || cargando}
          className="btn-paginacion"
        >
          Anterior
        </button>
        
        <span className="info-pagina">
          Página {paginaActual} de {totalPaginas} ({totalNoticias} noticias)
        </span>
        
        <button 
          onClick={() => cambiarPagina(paginaActual + 1)} 
          disabled={paginaActual === totalPaginas || cargando}
          className="btn-paginacion"
        >
          Siguiente
        </button>
      </div>
    );
  };

  return (
    <>
      <HomeLayout />
      {error && <div className="error-message">{error}</div>}
            
      {/* Paginación superior */}
      {renderPaginacion()}
      
      <div className="noticias-container">
        {noticias.length > 0 ? (
          noticias.map((noticia, index) => (
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
                <p className="fuente-autor">
                  {noticia.fuente} • {noticia.autor}
                  {noticia.tipo === 'local' && <span className="badge local"> - </span>}
                  {noticia.tipo === 'api' && <span className="badge api"> - </span>}
                  {noticia.categor && <span className="badge categoria">{noticia.categor}</span>}
                </p>
                <p className="fecha-noticia">
                  {formatearFecha(noticia.fechaAprobacion || noticia.fechaCreacion)}
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
        ) : !cargando && (
          <div className="no-noticias">No hay noticias disponibles en este momento</div>
        )}
      </div>
      
      <article className={isOpen ? "modalLocalNew is-open" : "modalLocalNew"} onClick={handleClose}>
        <div className="modal-container-localNew" onClick={handleModalContainerClick}>
          <div className="noticia-modal">
            <a href={viewNotice.imagen} target="_blank" rel="noopener noreferrer">
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
      
      {renderPaginacion()}
    </>
  );
};

// Función auxiliar para generar hash de URLs
String.prototype.hashCode = function() {
  let hash = 0;
  if (this.length === 0) return hash;
  for (let i = 0; i < this.length; i++) {
    const char = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

export default HomePage;