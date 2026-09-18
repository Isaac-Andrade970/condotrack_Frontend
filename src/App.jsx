import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ReportesPage from "./pages/ReportesPage";
import ReporteDetailPage from "./pages/ReporteDetailPage";
import CategoriasPage from "./pages/CategoriasPage";
import "./App.css";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <main className="container">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/reportes"
              element={
                <ProtectedRoute>
                  <ReportesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reportes/:id"
              element={
                <ProtectedRoute>
                  <ReporteDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/categorias"
              element={
                <ProtectedRoute>
                  <CategoriasPage />
                </ProtectedRoute>
              }
            />

            <Route path="/" element={<Navigate to="/reportes" replace />} />
            <Route path="*" element={<Navigate to="/reportes" replace />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  );
}
