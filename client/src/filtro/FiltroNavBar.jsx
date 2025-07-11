import { Link } from "react-router-dom";
import "./filtroNavBar.css";
import axios from "axios";
import { useEffect, useState } from "react";

export const FiltroNavBar = () => {

  const [categoria, setCategoria] = useState([]);

  const getCatIdAsc = () => {
    try {
      axios.get("http://localhost:5000/api/category/getByIdAsc").then((response) => {
        setCategoria(response.data);
      });
    } catch (error) {
      alert(error);
    }
  }

  const getCatIdDesc = () => {
    try {
      axios.get("http://localhost:5000/api/category/getByIdDesc").then((response) => {
        setCategoria(response.data);
      });
    } catch (error) {
      alert(error);
    }
  }

  const getCatNameAsc = () => {
    try {
      axios.get("http://localhost:5000/api/category/getByNameAsc").then((response) => {
        setCategoria(response.data);
      })
    } catch (error) {
      alert(error);
    }
  }
  const getCatNameDesc = () => {
    try {
      axios.get("http://localhost:5000/api/category/getByNameDesc").then((response) => {
        setCategoria(response.data);
      })
    } catch (error) {
      alert(error);
    }
  }

  useEffect(() => {

    if ( localStorage.getItem("priority") === null ) {
      localStorage.setItem("priority", "id")
    }

    if ( localStorage.getItem("priority") === "id" ) {
      if ( JSON.parse(localStorage.getItem("orderId")) === true ) {
        getCatIdDesc();
        
      } else {
        getCatIdAsc();
      }
    }

    if ( localStorage.getItem("priority") === "name" ) {
      if ( JSON.parse(localStorage.getItem("orderName")) === true ) {
        getCatNameAsc();
      } else {
        getCatNameDesc();
      }
    }
    
  }, []);

  const scrollFunctionLeft = () => {
    const filScroll = document.getElementById('filtro');
    filScroll.scrollLeft -= 300;
  }

  const scrollFunctionRight = () => {
    const filScroll = document.getElementById("filtro");
    filScroll.scrollLeft += 300;
  }

  return (
    <header>
      <div className="filtroMaster">
        <button onClick={scrollFunctionLeft} id="btnLeft" className="scrollBtn">◄</button>
        <div className="filtroContainer">
          <div id="filtro" className="filtro">
            
            {
              categoria.map((val, key) => {
                return <button  key={key}>
                  <Link value={val.category_name} to="/home/filtroPage" state={val.category_name}>
                    {val.category_name}
                  </Link>
                </button>  
              })
            }

          </div>
        </div>
        <button onClick={scrollFunctionRight} id="btnRight" className="scrollBtn">►</button>
      </div>
    </header>
  )
}
