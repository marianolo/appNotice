import { Route, Routes } from "react-router-dom";
import { HomeRoutes } from "../pages/home/routes/HomeRoutes";
import Login from "../pages/login/login";
import Register from "../pages/register/register";
import AddNotice from "../pages/admin/addNotice/addNotice";
import EditNotice from "../pages/admin/editNotice/editNotice";
import EditProfileAdmin from "../pages/admin/editProfileAdmin/editProfileAdmin";
import ProtectedRoute from "./ProtectedRoute";
import { AddCategory } from "../pages/admin/addCategory/AddCategory";

export const AppRouter = () => {
  return (
    <Routes>
      {/* RUTAS PÚBLICAS */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/*" element={<HomeRoutes />} />

      {/* RUTAS PRIVADAS - ADMIN */}
      <Route 
        path="/admin/addNotice" 
        element={
          <ProtectedRoute requiredRole="admin">
            <AddNotice />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/edit-notice" 
        element={
          <ProtectedRoute requiredRole="admin">
            <EditNotice />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/addCategory"
        element={
          <ProtectedRoute requiredRole="admin">
            <AddCategory />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};