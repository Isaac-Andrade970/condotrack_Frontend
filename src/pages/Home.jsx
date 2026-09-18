import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user } = useAuth();

  return (
    <div>
      <h1>Hola, {user?.nombre}</h1>
      <p>
        Sesión iniciada correctamente. Las secciones de Reportes, Categorías y
        Comentarios se integran aquí en sus propias ramas (feature/*).
      </p>
    </div>
  );
}
