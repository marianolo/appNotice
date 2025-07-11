import { Logo } from "../../components/Logo"
import { NavBar } from "../../components/NavBar"
import "./nosotros.css";
import { BsPersonFill } from "react-icons/bs";
import { GrDocumentPerformance } from "react-icons/gr";
import { FaPhone } from "react-icons/fa";
import { MdSecurityUpdateGood } from "react-icons/md";

export const Nosotros = () => {
  return (
    <div>
      <NavBar />
      <Logo />
      <div className="nosotros-master">
        <div className="nosotros-container">
          <h1><strong>Acerca de nosotros</strong></h1>
          
          <div className="sections-grid">
            <div className="section-item">
              <h2><strong>¿Quienes Somos?</strong></h2>
              <span><BsPersonFill /></span>
              <h2>Somos un canal de televisión del noroeste Argentino en busca de posicionarnos como las primeras opciones a la hora de requerir información de último momento.</h2>
            </div>

            <div className="section-item">
              <h2><strong>Productividad</strong></h2>
              <span><GrDocumentPerformance /></span>
              <h2>Nuestro equipo consta de personal competente, autodidacta y dispuesto a mejorar continuamente el presente servicio de alta demanda.</h2>
            </div>

            <div className="section-item">
              <h2><strong>Tendencia</strong></h2>
              <span><MdSecurityUpdateGood /></span>
              <h2>Con nuestros servicios el usuario permanecerá al día de todas las novedades disponibles.</h2>
            </div>

            <div className="section-item">
              <h2><strong>Contactanos</strong></h2>
              <span><FaPhone /></span>
              <h2>canal7nortetvivo@gmail.com</h2>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}