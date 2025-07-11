import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './register.css';

const Register = () => {
  const [userData, setUserData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!userData.nombre || !userData.email || !userData.password || !userData.confirmPassword) {
      setError('Todos los campos son obligatorios');
      return false;
    }
    
    if (userData.password !== userData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    
    if (userData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombre: userData.nombre,
          email: userData.email,
          password: userData.password
        })
      });
      
      // Si la respuesta no es JSON, verifica el tipo de contenido
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Respuesta no es JSON:', text);
        throw new Error('El servidor no devolvió un formato JSON válido');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar usuario');
      }

      setSuccess('Usuario registrado correctamente');
      
      // Guardar información de usuario y token en localStorage
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      
      // Redireccionar según el rol después de un breve periodo
      setTimeout(() => {
        if (data.user.rol === 'admin') {
          navigate('/admin/addNotice');
        } else {
          navigate('/home');
        }
      }, 1500);
      
    } catch (err) {
      console.error('Error en el registro:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-form-wrapper">
        <h2>Crear Cuenta</h2>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label htmlFor="nombre">Nombre</label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={userData.nombre}
              onChange={handleChange}
              required
              placeholder="Tu nombre completo"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              name="email"
              value={userData.email}
              onChange={handleChange}
              required
              placeholder="ejemplo@correo.com"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              value={userData.password}
              onChange={handleChange}
              required
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Contraseña</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={userData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Repite tu contraseña"
            />
          </div>
          
          <button 
            type="submit" 
            className="register-button" 
            disabled={loading}
          >
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>
        
        <div className="register-footer">
          <p>¿Ya tienes cuenta? <a href="/login">Iniciar sesión</a></p>
        </div>
      </div>
    </div>
  );
};

export default Register;