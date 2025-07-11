import axios from "axios";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export const useFiltro = () => {

  const location = useLocation();

  const [noticia, setNoticia] = useState([]);
    
    const getNoticias = () => {
      axios.get("http://localhost:5000/api/news/publicAll").then((response) => {
        setNoticia(response.data.data.filter(noti => noti.categor === location.state));
      })
    }

    useEffect(() => {
      getNoticias();
  
    }, [location]);

  return {
    noticia,
  }
}
