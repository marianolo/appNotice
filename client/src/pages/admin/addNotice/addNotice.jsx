import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './addNotice.css';
import { Link } from 'react-router-dom';
import { ModalEditCategory } from './modal/ModalEditCategory';

// URL base para todas las llamadas API
const API_BASE_URL = 'http://localhost:5000'; 

const AddNotice = () => {
  // Estados para manejar noticias de API
  const [apiNews, setApiNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);

  // Estados para la creación de noticias propias
  const [newNotice, setNewNotice] = useState({
    titulo: '',
    categoria_id: '',
    contenido: '',
    imagen: ''
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  // Estados para filtrar noticias
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');

  // Almacenar categorias de la "db"
  const [categoria, setCategoria] = useState([]);
  
  // Variables para ventana modal
  const [edit, setEdit] = useState(false);
  const [idExtract, setIdExtract] = useState({});

  // Variables para actualizar categoria de noticias traidas por apis
  const [updateNotice, setUpdateNotice] = useState({
    categoria_id: "",
  });

  // Obtener noticias de la API al cargar el componente
  // Obtener categorias
  useEffect(() => {
    fetchApiNews();
    getCategorias();
  }, []);

  // Función para obtener noticias de la API
  const fetchApiNews = async () => {
    setLoading(true);
    setError(null);
    setErrorDetails(null);
    
    try {      
      // URL actualizada según la nueva estructura de rutas
      const response = await axios.get(`${API_BASE_URL}/api/news-api/pending`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Verificar si la respuesta tiene una estructura {data: Array, meta: Object}
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        const newsArray = response.data.data;
        setApiNews(newsArray);
        
        if (newsArray.length === 0) {
          setError('No hay noticias pendientes disponibles.');
        }
      } else if (response.data && Array.isArray(response.data)) {
        setApiNews(response.data);
        
        if (response.data.length === 0) {
          setError('No hay noticias pendientes disponibles.');
        }
      } else {
        console.error('Formato de respuesta inesperado:', response.data);
        setError('La respuesta del servidor no tiene el formato esperado.');
        setErrorDetails('La API no devolvió una lista de noticias válida');
      }
    } catch (err) {
      console.error('Error completo al cargar noticias:', err);
      
      if (err.response) {
        console.error('Error de respuesta:', err.response.status, err.response.data);
        
        if (err.response.status === 401) {
          setError('No tienes autorización para acceder a esta sección. Por favor, inicia sesión nuevamente.');
        } else if (err.response.status === 403) {
          setError('No tienes permisos suficientes para ver estas noticias.');
        } else if (err.response.status === 429) {
          setError('Se ha excedido el límite de solicitudes diarias a la API externa.');
        } else if (err.response.status >= 500) {
          setError('Error en el servidor. El equipo técnico ha sido notificado.');
          setErrorDetails(`Error ${err.response.status}: ${err.response.data.message || 'Error interno del servidor'}`);
        } else {
          setError(`Error al cargar noticias (${err.response.status}): ${err.response.data.message || 'Detalles no disponibles'}`);
        }
      } else if (err.request) {
        console.error('Error de solicitud (sin respuesta):', err.request);
        setError('No se pudo conectar con el servidor. Verifica tu conexión a internet.');
        setErrorDetails('El servidor no respondió a la solicitud');
      } else {
        console.error('Error de configuración:', err.message);
        setError('Error al preparar la solicitud de noticias.');
        setErrorDetails(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambio de estado de una noticia (aprobar/rechazar)
  const handleStatusChange = async (id, newStatus, categ) => {
    if (newStatus === 'aprobada') {
      if (!updateNotice.categoria_id.trim()) {
          setFormError("La categoría es obligatoria");
          setFormSubmitting(false);
          setTimeout(() => setFormError(null), 3000);
          return;
      }
    }

    try {        
        const payload = {
            estado: newStatus
        };

        if (newStatus === 'aprobada' && categ) {
            payload.categoria_id = categ;
            payload.categoriaApi = categ; 

        }

        const response = await axios.put(`${API_BASE_URL}/api/news-api/${id}/statusNewApi`,
          payload,
          {
              headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`
              }
          }
      );
      
      // Siempre filtrar la noticia si la petición fue exitosa (no depender de response.data.success)
      if (response.status === 200) {
          // Actualizar la lista de noticias
          setApiNews(apiNews.filter(news => news.id !== id));
          
          // Mostrar mensaje de éxito
          setFormSuccess(`Noticia ${newStatus === 'aprobada' ? 'Aprobada' : 'Rechazada'} correctamente`);
          setTimeout(() => setFormSuccess(null), 3000);
      
          // Limpiar el estado de la ventana modal
          setEdit(false);
          setIdExtract({});
          setUpdateNotice({
              categoria_id: "",
          });
        } else {
            throw new Error('La operación no fue exitosa');
        }
        
    } catch (err) {
        console.error('Error detallado al cambiar estado:', err);
        
        let errorMsg = 'Error al cambiar el estado de la noticia';
        
        if (err.response && err.response.data && err.response.data.message) {
            errorMsg += `: ${err.response.data.message}`;
        }
        
        setFormError(errorMsg);
        setTimeout(() => setFormError(null), 5000);
    }
};

  // Manejar cambios en el formulario de nueva noticia
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewNotice({
      ...newNotice,
      [name]: value
    });
  };

  // Enviar formulario de nueva noticia
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);
    
    // Validar campos antes de enviar
    if (!newNotice.titulo.trim()) {
      setFormError('El título es obligatorio');
      setFormSubmitting(false);
      return;
    }
    
    if (!newNotice.contenido.trim()) {
      setFormError('El contenido es obligatorio');
      setFormSubmitting(false);
      return;
    }

    if (!newNotice.categoria_id.trim()) {
      setFormError("La categoria es obligatoria");
      setFormSubmitting(false);
      return;
    }

    if(!newNotice.imagen.trim()) {
      setFormError('La imagen es obligatoria');
      setFormSubmitting(false);
      return;
    }
    
    try {
      // Verificar token de autenticación
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay sesión activa. Por favor, inicia sesión nuevamente.');
      }
      
      // Ruta para crear noticias propias
      const response = await axios.post(`${API_BASE_URL}/api/news/news`, newNotice, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Limpiar formulario después de enviar
      setNewNotice({
        titulo: '',
        categoria_id: '',
        contenido: '',
        imagen: ''
      });
      
      setFormSuccess('Noticia creada correctamente');
      setTimeout(() => setFormSuccess(null), 3000);
    } catch (err) {
      console.error('Error detallado al crear noticia:', err);
      
      let errorMessage = 'Error al crear la noticia';
      
      if (err.response) {
        console.error('Detalles del error:', err.response.status, err.response.data);
        
        if (err.response.data.message && err.response.data.message.includes('autor_id cannot be null')) {
          errorMessage = 'Error: No se pudo asignar el autor. Por favor, verifica tu sesión e inténtalo nuevamente.';
        } else if (err.response.data.message) {
          errorMessage = `Error: ${err.response.data.message}`;
        } else if (err.response.status === 401) {
          errorMessage = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
        } else if (err.response.status === 403) {
          errorMessage = 'No tienes permisos para crear noticias.';
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setFormError(errorMessage);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Intentar cargar noticias nuevamente
  const handleRetryLoad = () => {
    fetchApiNews();
  };

  // Filtrar noticias según el término de búsqueda
  const filteredNews = apiNews.filter(news => 
    news.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    news.fuente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    news.contenido?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Peticion http de categorias a db
  const getCategorias = () => {
    axios.get(`${API_BASE_URL}/api/category`).then((response) => {
      setCategoria(response.data);
    })
  } 

  // Función para gestionar la aprobación de noticias con modal
  const handleNoticiaAprobada = (idExtraida) => {
    setEdit(true);
    setIdExtract(idExtraida);
  }

  return (
    <div className="add-notice-container">
      <h1>Administración de Noticias</h1>
      
      {/* Pestañas para alternar entre secciones */}
      <div className="tabs">
        <button 
          className={activeTab === 'pending' ? 'active' : ''} 
          onClick={() => setActiveTab('pending')}
        >
          Noticias pendientes
        </button>
        <button 
          className={activeTab === 'create' ? 'active' : ''} 
          onClick={() => setActiveTab('create')}
        >
          Crear noticia
        </button>
        {/* Botón/enlace para ir a Editar Noticias */}
        <Link to="/admin/edit-notice" className="tab-link">
          Gestionar noticias publicadas
        </Link>
        {/* Botón/enlace para ir a Editar Noticias */}
        <Link to="/admin/addCategory" className="tab-link cat">
          Gestionar Categorías
        </Link>
      </div>

      {/* Sección de noticias pendientes */}
      {activeTab === 'pending' && (
        <div className="pending-news-section">
          <h2>Noticias pendientes de APIs</h2>
          
          {/* Mensaje de éxito diferenciado */}
          {
            formSuccess?.includes("Aprobada") ? 
            <p className="success-message">{formSuccess}</p> :
            formSuccess?.includes("Rechazada") ? 
            <p className="error-message">{formSuccess}</p> : ""
          }
          
          {/* Buscador */}
          <div className="search-bar">
            <input 
              type="text" 
              placeholder="Buscar por título, fuente o contenido..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {loading && <p className="loading">Cargando noticias...</p>}
          
          {/* Mostrar mensajes de error con opción de reintentar */}
          {error && (
            <div className="error-container">
              <p className="error-message">{error}</p>
              {errorDetails && <p className="error-details">{errorDetails}</p>}
              <button className="retry-button" onClick={handleRetryLoad}>
                Reintentar
              </button>
            </div>
          )}
          
          {!loading && !error && filteredNews.length === 0 && (
            <p className="empty-message">
              No hay noticias pendientes. Las noticias se actualizan cuando el servidor obtiene nuevos contenidos de las APIs externas.
            </p>
          )}
          
          <div className="news-grid">
            {filteredNews.map(news => (
              <div key={news.id} className="news-card">
                {news.imagen && (
                  <div className="news-image">
                    <img src={news.imagen} alt={news.titulo} onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300x200?text=Imagen+no+disponible';
                    }} />
                  </div>
                )}
                <div className="news-content">
                  <h3>{news.titulo}</h3>
                  <p className="news-source">Fuente: {news.fuente}</p>
                  <div className="news-text">{news.contenido}</div>
                  {news.url && (
                    <a href={news.url} target="_blank" rel="noopener noreferrer" className="news-link">
                      Ver noticia original
                    </a>
                  )}
                </div>
                <div className="action-buttons">
                  <button 
                    className="approve-btn"
                    onClick={() => handleNoticiaAprobada({
                      "id": news.id, 
                      "imagen": news.imagen, 
                      "titulo": news.titulo, 
                      "fuente": news.fuente, 
                      "contenido": news.contenido, 
                      "url": news.url
                    })}
                  >
                    Aprobar
                  </button>
                  <button 
                    className="reject-btn"
                    onClick={() => handleStatusChange(news.id, 'rechazada')}
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Componente modal para editar categoría */}
      <ModalEditCategory 
        edit={edit}
        setEdit={setEdit}
        idExtract={idExtract}
        setIdExtract={setIdExtract}
        categoria={categoria}
        handleStatusChange={handleStatusChange}
        updateNotice={updateNotice}
        setUpdateNotice={setUpdateNotice}
        formError={formError}
      />

      {/* Sección para crear nuevas noticias */}
      {activeTab === 'create' && (
        <div className="create-news-section">
          <h2>Crear nueva noticia</h2>
          
          {formSuccess && <p className="success-message">{formSuccess}</p>}
          {formError && <p className="error-message">{formError}</p>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="titulo">Título:</label>
              <input 
                type="text" 
                id="titulo" 
                name="titulo" 
                value={newNotice.titulo} 
                onChange={handleInputChange} 
                required 
              />
            </div>

            <div className="form-group">
              <label htmlFor="categoria_id">Categoria:</label>
              <select onChange={handleInputChange} name="categoria_id" id="categoria_id" value={newNotice.categoria_id}>
                {/* Funcion map para mostrar todas las categorias */}
                <option value={""}>Seleccione una categoria</option>
                {
                  categoria.map((val, key) => {
                    return <option key={key} value={val.id}>{val.category_name}</option>
                  })
                }
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="contenido">Contenido:</label>
              <textarea 
                id="contenido" 
                name="contenido" 
                value={newNotice.contenido} 
                onChange={handleInputChange} 
                required 
                rows="10"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="imagen">URL de imagen (opcional):</label>
              <input 
                type="url" 
                id="imagen" 
                name="imagen" 
                value={newNotice.imagen} 
                onChange={handleInputChange} 
                placeholder="https://ejemplo.com/imagen.jpg" 
              />
            </div>
            
            <div className="form-actions">
              <button 
                type="submit" 
                className="submit-btn" 
                disabled={formSubmitting}
              >
                {formSubmitting ? 'Creando...' : 'Crear noticia'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AddNotice;