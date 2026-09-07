import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="navbar">
      <div className="navbar-brand">ReportaYa</div>

      <div className="navbar-user">
        {user ? (
          <>
            <span>{user.nombre}</span>
            <button type="button" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Iniciar sesión</Link>
            <Link to="/register">Registrarse</Link>
          </>
        )}
      </div>
    </header>
  );
}
