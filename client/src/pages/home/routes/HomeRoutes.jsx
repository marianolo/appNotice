import { Navigate, Route, Routes } from "react-router-dom"

import { HomePage } from "../HomePage"
import { RadioPage } from "../RadioPage"
import { Nosotros } from "../Nosotros"

import { FiltroPage } from "../../../filtro/page/FiltroPage"

export const HomeRoutes = () => {
  return (
    <Routes>
      <Route path="home/*" element={ <HomePage /> } />
      <Route path="radio" element={ <RadioPage /> } />
      <Route path="nosotros" element={ <Nosotros /> } />

      <Route path="/home/filtroPage" element={<FiltroPage />} />

      <Route path="/*" element={ <Navigate to="/home" /> } />
    </Routes>
  )
}
