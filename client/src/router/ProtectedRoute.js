import { Navigate } from "react-router-dom";

// Componente para proteger rutas según el rol del usuario
const ProtectedRoute = ({ children, requiredRole }) => {
  // Obtener el usuario del localStorage
  const userString = localStorage.getItem('user');
  
  // Si no hay usuario, redirigir al login
  if (!userString) {
    return <Navigate to="/login" replace />;
  }
  
  try {
    // Convertir el string a objeto
    const user = JSON.parse(userString);
    
    // Verificar si el usuario tiene el rol requerido
    if (requiredRole && user.rol !== requiredRole) {
      // Si no tiene el rol adecuado, redirigir a home
      return <Navigate to="/home" replace />;
    }
    
    // Si tiene el rol adecuado, mostrar el componente hijo
    return children;
  } catch (error) {
    // Si hay algún error al parsear el usuario, redirigir al login
    console.error("Error al verificar la autenticación:", error);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;