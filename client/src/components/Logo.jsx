import logoNorteTv from "../vite.png";
import "./logo.css";
import { useNavigate } from "react-router-dom";

export const Logo = () => {

  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/home");
  }

  return (
    <>
      <div className="logoMaster">
        <div className="logoContainer">
          <img onClick={handleClick} src={logoNorteTv} />
          {/* <h1>Noticias Norte TV</h1> */}
        </div>
      </div>
    </>
  )
}
