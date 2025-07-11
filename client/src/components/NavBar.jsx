import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./navBar.css";
import logoNorte from "../vite.png";
import { Link } from "react-router-dom";
import { Clima } from "./Clima";
import axios from "axios";
import { ModalCloseSesion } from "./modal/ModalCloseSesion";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export const NavBar = ({ active }) => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [ modalCloseSesion, setModalCloseSesion ] = useState(false);

  const user = localStorage.getItem("user");
  const nombreUser = JSON.parse(user)?.nombre;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      getUserInfo(token);
    }
  }, []);

  // Función para obtener información del usuario
  const getUserInfo = async (token) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUserInfo(response.data);
    } catch (error) {
      console.error('Error al obtener información del usuario:', error);
      // Si el token es inválido, limpiar la autenticación
      handleLogout();
    }
  };

  const handleLog = () => {
    navigate("/login");
  };

  const handleReg = () => {
    navigate("/register");
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (token) {
        // Llamar al endpoint de logout en el servidor
        await axios.post(`${API_BASE_URL}/api/auth/logout`, {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Error al cerrar sesión en el servidor:', error);
      // Continuar con el logout local incluso si hay error en el servidor
    } finally {
      // Limpiar datos locales
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
      setUserInfo(null);
      closeModal();
      
      navigate('/home');
    }
  };

  const handleAdminPanel = () => {
    if (userInfo?.rol === 'admin') {
      navigate('/admin/addNotice');
    }
  };

  const closeSesion = () => {
    setModalCloseSesion(true);
  }

  const closeModal = () => {
    setModalCloseSesion(false);
  }

  return (
    <header>
      <div className="navBarMaster">
        <div className="navBarContainer">
          <div className="enlaces">
            <button className="btnLogo">
              <Link to="/home">
                <img className="logoNorteNavBar" src={logoNorte} alt="Logo" />
              </Link>
            </button>

            <button className={active === "nosotros" ? "active" : ""}>
              <Link to="/nosotros">Nosotros</Link>
            </button>
          </div>

          <Clima />

          <div className="login">
            {
              isAuthenticated && userInfo?.rol === "admin" ?
              <>
                <span className="user-welcome">
                  Hola, {userInfo?.nombre || 'Usuario'}!
                </span>
                <button onClick={handleAdminPanel} className="reg">
                  Panel Admin
                </button>
                <button onClick={closeSesion} className="log">
                  Cerrar Sesión
                </button>
              </> : 
              isAuthenticated && userInfo?.rol === "editor" ? 
              <>
                <span className="user-welcome">
                  Hola, {userInfo?.nombre || 'Usuario'}!
                </span>
                <button onClick={closeSesion} className="log">
                  Cerrar Sesión
                </button>
              </> : 
              <>
                <button onClick={handleLog} className="log">Iniciar Sesión</button>
                <button onClick={handleReg} className="reg">Registrarse</button>
              </>
            }
            <ModalCloseSesion 
              modalCloseSesion={modalCloseSesion}
              setModalCloseSesion={setModalCloseSesion}
              closeModal={closeModal}
              nombreUser={nombreUser}
              handleLogout={handleLogout}
            />
          </div>
        </div>
      </div>
    </header>
  );
};