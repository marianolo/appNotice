import axios from "axios";
import { useEffect, useState } from "react";

export const Clima = () => {

  const [clima, setClima] = useState(null);

  useEffect(() => {
    const obtenerUbicacion = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (posicion) => {
            const { latitude, longitude } = posicion.coords;
            const apiKey = "a9e72bf50bdf4e1ec64fcafca2981720"; 
            const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric&lang=es`;

            try {
              const respuesta = await axios.get(url);
              setClima(respuesta.data);
            } catch (error) {
              console.error("error al obtener el clima:", error);
            }
          },
          (error) => {
            console.error("error al obtener ubicación:", error);
          }
        );
      } else {
        console.error("error en la geolocalización");
      }
    };

    obtenerUbicacion();
  }, []);

  return (
    <div>
      <div className="clima">
        {clima && (
          <div className="clima-info">
            <img
              className="clima-icono"
              src={`http://openweathermap.org/img/wn/${clima.weather[0].icon}@2x.png`}
              alt="ícono del clima"
            />
            <span>{clima.main.temp}°C</span>
          </div>
        )}
      </div>
    </div>
  )
}
