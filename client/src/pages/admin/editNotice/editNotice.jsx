import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './editNotice.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const EditNotice = () => {
  // Estados para manejar las noticias
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newsTypeFilter, setNewsTypeFilter] = useState('');
  
  // Estado para la paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [newsPerPage, setNewsPerPage] = useState(6);
  
  // Estado para la noticia que se está editando
  const [editingNews, setEditingNews] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isOnlyCategoryEdit, setIsOnlyCategoryEdit] = useState(false);
  
  // Estado para notificaciones
  const [notification, setNotification] = useState(null);
  
  // Estado para confirmación de eliminación
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    newsId: null,
    newsTitle: '',
    isManual: false
  });

  useEffect(() => {
    fetchNews();
    fetchCategories();
  }, [currentPage, selectedCategory, newsPerPage]);

  useEffect(() => {
    if (newsTypeFilter) {
      setNewsPerPage(100);
      setCurrentPage(1);
    } else {
      setNewsPerPage(6);
      setCurrentPage(1);
    }
  }, [newsTypeFilter]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/category`, {
        timeout: 5000
      });
      setCategories(response.data);
    } catch (err) {
      console.error('Error al cargar categorías:', err);
    }
  };

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let endpoint = `${API_BASE_URL}/api/news/public?page=${currentPage}&pageSize=${newsPerPage}`;
      
      if (selectedCategory) {
        endpoint += `&categoria=${encodeURIComponent(selectedCategory)}`;
      }
      
      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        timeout: 5000
      });
      
      let newsData = [];
      let totalItems = 0;
      
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        newsData = response.data.data;
        totalItems = response.data.meta?.totalItems || response.data.pagination?.total || newsData.length;
      } else if (response.data && Array.isArray(response.data)) {
        newsData = response.data;
        totalItems = response.data.length;
      }
      
      setNews(newsData);
      setTotalPages(Math.ceil(totalItems / newsPerPage));
      
      if (newsData.length === 0 && currentPage > 1) {
        setCurrentPage(1);
      }
    } catch (err) {
      console.error('Error al cargar noticias:', err);
      setError(err.response?.data?.message || err.message || 'Error al cargar noticias');
    } finally {
      setLoading(false);
    }
  };

  const isManualNews = (newsItem) => {
    if (typeof newsItem.id === 'string' && newsItem.id.startsWith('local-')) {
      return true;
    }
    return !newsItem.fuente || newsItem.fuente === 'Manual' || newsItem.fuente === 'Local';
  };

  const getRealId = (newsItem) => {
    if (typeof newsItem.id === 'string') {
      if (newsItem.id.startsWith('local-')) {
        return newsItem.id.replace('local-', '');
      }
      if (newsItem.id.startsWith('api-')) {
        return newsItem.id.replace('api-', '');
      }
    }
    return newsItem.id;
  };

  const getCategoryName = (newsItem) => {
    if (newsItem.categoria) {
      return newsItem.categoria;
    }
    if (newsItem.categorApi && newsItem.categorApi.category_name) {
      return newsItem.categorApi.category_name;
    }
    if (newsItem.categoria_id && newsItem.categorApi) {
      return newsItem.categorApi.category_name;
    }
    if (newsItem.category_name) {
      return newsItem.category_name;
    }
    if (newsItem.categor) {
      return newsItem.categor;
    }
    return 'Sin categoría';
  };

  const handleEditClick = (newsItem) => {
    setEditingNews({
      ...newsItem,
      id: getRealId(newsItem),
      categoria: getCategoryName(newsItem),
      destacada: newsItem.destacada || false
    });
    setIsOnlyCategoryEdit(false);
    setIsEditModalOpen(true);
  };

  const handleCategoryEditClick = (newsItem) => {
    if (!isManualNews(newsItem)) {
      const realId = getRealId(newsItem);
      setEditingNews({
        ...newsItem,
        id: realId,
        categoria: getCategoryName(newsItem)
      });
      setIsOnlyCategoryEdit(true);
      setIsEditModalOpen(true);
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingNews(null);
    setIsOnlyCategoryEdit(false);
  };

  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditingNews(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    
    if (!isOnlyCategoryEdit && (!editingNews.titulo?.trim() || !editingNews.contenido?.trim())) {
      setNotification({
        type: 'error',
        message: 'Todos los campos obligatorios (*) deben estar completos'
      });
      return;
    }
    
    try {
      const isManual = isManualNews(editingNews);
      const endpoint = isManual 
        ? `/api/news/news/${editingNews.id}` 
        : `/api/news-api/${editingNews.id}`;
      
      const selectedCat = categories.find(cat => cat.category_name === editingNews.categoria);
      const categoriaId = selectedCat ? selectedCat.id : null;
      
      let updateData = {
        titulo: editingNews.titulo,
        contenido: editingNews.contenido,
        categoria_id: categoriaId,
        imagen: editingNews.imagen,
        destacada: editingNews.destacada
      };

      // Actualización inmediata del estado local ANTES de la llamada API
      setNews(prevNews => prevNews.map(item => {
        if (getRealId(item) === editingNews.id) {
          return {
            ...item,
            ...updateData,
            categoria: editingNews.categoria,
            categorApi: selectedCat || item.categorApi
          };
        }
        return item;
      }));

      // Llamada API
      await axios.put(`${API_BASE_URL}${endpoint}`, updateData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        timeout: 5000
      });

      setNotification({
        type: 'success',
        message: 'Noticia actualizada correctamente'
      });
      
      setIsEditModalOpen(false);
      setTimeout(() => setNotification(null), 2000);
    } catch (err) {
      console.error('Error al actualizar la noticia:', err);
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Error al actualizar la noticia'
      });
      
      // Revertir cambios si falla la API
      fetchNews();
    }
  };

  const handleDeleteClick = (newsItem) => {
    const id = getRealId(newsItem);
    setDeleteConfirmation({
      isOpen: true,
      newsId: id,
      newsTitle: newsItem.titulo,
      isManual: isManualNews(newsItem)
    });
  };

  const handleCancelDelete = () => {
    setDeleteConfirmation({
      isOpen: false,
      newsId: null,
      newsTitle: '',
      isManual: false
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmation.newsId) return;
    
    try {
      // Eliminación inmediata del estado local ANTES de la llamada API
      setNews(prevNews => prevNews.filter(item => getRealId(item) !== deleteConfirmation.newsId));
      
      const endpoint = deleteConfirmation.isManual
        ? `/api/news/news/${deleteConfirmation.newsId}`
        : `/api/news-api/${deleteConfirmation.newsId}`;
      
      await axios.delete(`${API_BASE_URL}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        timeout: 5000
      });
      
      setNotification({
        type: 'success',
        message: 'Noticia eliminada correctamente'
      });
      
      setDeleteConfirmation({
        isOpen: false,
        newsId: null,
        newsTitle: '',
        isManual: false
      });
      
      setTimeout(() => setNotification(null), 2000);
    } catch (err) {
      console.error('Error al eliminar la noticia:', err);
      
      // Revertir cambios si falla la API
      fetchNews();
      
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Error al eliminar la noticia'
      });
    }
  };

  const handleChangeStatus = async (newsItem) => {
    const id = getRealId(newsItem);
    
    try {
      // Actualización inmediata del estado local
      setNews(prevNews => prevNews.filter(item => getRealId(item) !== id));
      
      const response = await axios.put(`${API_BASE_URL}/api/news-api/${id}/status`, 
        { estado: 'pendiente' },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          timeout: 5000
        }
      );
      
      setNotification({
        type: 'success',
        message: 'Noticia marcada como pendiente correctamente'
      });
      
      setTimeout(() => setNotification(null), 2000);
    } catch (err) {
      console.error('Error al cambiar estado de la noticia:', err);
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Error al cambiar estado de la noticia'
      });
    }
  };

  const handleCategoryFilterChange = (e) => {
    setSelectedCategory(e.target.value);
    setCurrentPage(1);
  };

  const handleNewsTypeFilterChange = (e) => {
    setNewsTypeFilter(e.target.value);
  };

  const filteredNews = newsTypeFilter 
    ? news.filter(item => {
        const isManualItem = isManualNews(item);
        if (newsTypeFilter === 'manual') {
          return isManualItem;
        } else if (newsTypeFilter === 'api') {
          return !isManualItem;
        }
        return true;
      })
    : news;

  const handlePageChange = (pageNumber) => {
    if (!newsTypeFilter) {
      setCurrentPage(pageNumber);
    }
  };

  const handleModalContainerClick = (e) => {
    e.stopPropagation();
  }

  useEffect(() => {
    if (isEditModalOpen || deleteConfirmation.isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    }
  }, [isEditModalOpen || deleteConfirmation.isOpen]);

  return (
    <div className="edit-notice-container">
      <div className="header-section">
        <h1>Gestión de Noticias</h1>
      </div>
      
      <div className="filter-container">
        <div className="news-type-filter">
          <select 
            value={newsTypeFilter}
            onChange={handleNewsTypeFilterChange}
            className="news-type-select"
          >
            <option value="">Todos los tipos de Noticias</option>
            <option value="manual">Noticias Manuales</option>
            <option value="api">Noticias de API</option>
          </select>
        </div>

        <div className="category-filter">
          <select 
            value={selectedCategory}
            onChange={handleCategoryFilterChange}
            className="category-select"
          >
            <option value="">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.category_name}>
                {cat.category_name}
              </option>
            ))}
          </select>
        </div>
        
        
      </div>
      
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
      
      <div className="content-section">
        {loading && <div className="loading">Cargando noticias...</div>}
        
        {error && (
          <div className="error-container">
            <p className="error-message">{error}</p>
            <button className="retry-button" onClick={fetchNews}>
              Reintentar
            </button>
          </div>
        )}
        
        {!loading && !error && filteredNews.length === 0 && (
          <p className="empty-message">
            {newsTypeFilter 
              ? `No se encontraron noticias ${newsTypeFilter === 'manual' ? 'manuales' : 'de API'}.` 
              : 'No se encontraron noticias para mostrar. Prueba a cambiar los filtros de búsqueda.'}
          </p>
        )}
        
        {!loading && !error && filteredNews.length > 0 && (
          <>
            <div className="news-grid">
              {filteredNews.map(item => (
                <div 
                  key={typeof item.id === 'string' ? item.id : `news-${item.id}`} 
                  className={`news-card ${isManualNews(item) ? 'manual' : 'api'}`}
                >
                  {item.imagen && (
                    <div className="news-image">
                      <img 
                        src={item.imagen} 
                        alt={item.titulo}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/300x200?text=Imagen+no+disponible';
                        }} 
                      />
                      <span className="news-badge">
                        {isManualNews(item) ? 'Manual' : 'API'}
                      </span>
                    </div>
                  )}
                  
                  <div className="news-content">
                    <h3>{item.titulo}</h3>
                    <div className="news-meta">
                      <span 
                        className="news-category" 
                        title={isManualNews(item) ? null : "Click para editar categoría"}
                        onClick={isManualNews(item) ? null : () => handleCategoryEditClick(item)}
                        style={isManualNews(item) ? {} : {cursor: 'pointer', textDecoration: 'underline'}}
                      >
                        {getCategoryName(item)}
                      </span>
                      {(item.fecha_creacion || item.createdAt || item.fecha || item.fecha_publicacion) && (
                        <span className="news-date">
                          {new Date(item.fecha_creacion || item.createdAt || item.fecha || item.fecha_publicacion).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className="news-excerpt">
                      {item.contenido?.substring(0, 150)}{item.contenido?.length > 150 ? '...' : ''}
                    </p>
                  </div>
                  
                  <div className="news-actions">
                    {isManualNews(item) ? (
                      <>
                        <button 
                          className="edit-button"
                          onClick={() => handleEditClick(item)}
                        >
                          <i className="fas fa-edit"></i> Editar
                        </button>
                        <button 
                          className="delete-button"
                          onClick={() => handleDeleteClick(item)}
                        >
                          <i className="fas fa-trash"></i> Eliminar
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          className="edit-button"
                          onClick={() => handleEditClick(item)}
                        >
                          <i className="fas fa-edit"></i> Editar
                        </button>
                        <button 
                          className="pending-button"
                          onClick={() => handleChangeStatus(item)}
                        >
                          <i className="fas fa-clock"></i> Pendiente
                        </button>
                        <button 
                          className="delete-button"
                          onClick={() => handleDeleteClick(item)}
                        >
                          <i className="fas fa-trash"></i> Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {totalPages > 1 && !newsTypeFilter && (
              <div className="pagination">
                <button 
                  onClick={() => handlePageChange(1)} 
                  disabled={currentPage === 1}
                  className="pagination-button"
                >
                  &laquo;
                </button>
                <button 
                  onClick={() => handlePageChange(currentPage - 1)} 
                  disabled={currentPage === 1}
                  className="pagination-button"
                >
                  &lt;
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`pagination-button ${currentPage === pageNum ? 'active' : ''}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button 
                  onClick={() => handlePageChange(currentPage + 1)} 
                  disabled={currentPage === totalPages}
                  className="pagination-button"
                >
                  &gt;
                </button>
                <button 
                  onClick={() => handlePageChange(totalPages)} 
                  disabled={currentPage === totalPages}
                  className="pagination-button"
                >
                  &raquo;
                </button>
              </div>
            )}
          </>
        )}
      </div>
      
      {isEditModalOpen && editingNews && (
        <div className="modal-overlay" onClick={handleCloseEditModal}>
          <div className="edit-modal" onClick={handleModalContainerClick}>
            <div className="modal-header">
              <h2>{isOnlyCategoryEdit ? 'Editar Categoría' : 'Editar Noticia'}</h2>
              <button className="close-modal" onClick={handleCloseEditModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <form className="edit-form" onSubmit={handleSaveEdit}>
              {!isOnlyCategoryEdit && (
                <div className="form-group">
                  <label htmlFor="titulo">Título *</label>
                  <input
                    type="text"
                    id="titulo"
                    name="titulo"
                    value={editingNews.titulo || ''}
                    onChange={handleEditInputChange}
                    required
                    placeholder="Ingrese el título de la noticia"
                  />
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="categoria">Categoría *</label>
                <select
                  id="categoria"
                  name="categoria"
                  value={editingNews.categoria || ''}
                  onChange={handleEditInputChange}
                  required
                >
                  <option value="">Seleccione una categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.category_name}>
                      {cat.category_name}
                    </option>
                  ))}
                </select>
              </div>
              
              {!isOnlyCategoryEdit && (
                <>
                  <div className="form-group">
                    <label htmlFor="contenido">Contenido *</label>
                    <textarea
                      id="contenido"
                      name="contenido"
                      value={editingNews.contenido || ''}
                      onChange={handleEditInputChange}
                      required
                      rows="8"
                      placeholder="Escriba el contenido completo de la noticia..."
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="imagen">URL de la imagen</label>
                    <input
                      type="url"
                      id="imagen"
                      name="imagen"
                      value={editingNews.imagen || ''}
                      onChange={handleEditInputChange}
                      placeholder="https://ejemplo.com/imagen.jpg"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        name="destacada"
                        checked={editingNews.destacada || false}
                        onChange={handleEditInputChange}
                      />
                      Noticia destacada
                    </label>
                  </div>
                </>
              )}
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={handleCloseEditModal}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="save-btn"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {deleteConfirmation.isOpen && (
        <div className="modal-overlay" onClick={handleCancelDelete}>
          <div className="confirm-modal" onClick={handleModalContainerClick}>
            <div className="modal-header">
              <h2>Confirmar eliminación</h2>
              <button className="close-modal" onClick={handleCancelDelete}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-content">
              <p>¿Estás seguro de que deseas eliminar la noticia:</p>
              <p className="news-title-confirm">"{deleteConfirmation.newsTitle}"?</p>
              <p className="warning">Esta acción no se puede deshacer.</p>
            </div>
            
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={handleCancelDelete}
              >
                Cancelar
              </button>
              <button 
                className="delete-confirm-btn"
                onClick={handleConfirmDelete}
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditNotice;