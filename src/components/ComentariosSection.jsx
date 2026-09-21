import { useEffect, useState } from "react";
import api from "../api/axios";

function ComentariosSection({ reporteId }) {
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const cargarComentarios = async () => {
    try {
      const { data } = await api.get(`/reportes/${reporteId}/comentarios`);
      setComentarios(data);
    } catch (err) {
      setError("No se pudieron cargar los comentarios");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarComentarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reporteId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nuevoComentario.trim()) return;

    setEnviando(true);
    setError(null);
    try {
      await api.post(`/reportes/${reporteId}/comentarios`, {
        contenido: nuevoComentario,
      });
      setNuevoComentario("");
      await cargarComentarios();
    } catch (err) {
      setError("No se pudo guardar el comentario");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="comentarios-section">
      <h3>Comentarios</h3>

      {error && <p className="error">{error}</p>}

      {cargando ? (
        <p>Cargando comentarios...</p>
      ) : comentarios.length === 0 ? (
        <p>Todavía no hay comentarios.</p>
      ) : (
        <ul className="comentarios-lista">
          {comentarios.map((c) => (
            <li key={c.id}>
              <strong>{c.usuario_id ? `Usuario #${c.usuario_id}` : "Anónimo"}:</strong>{" "}
              {c.contenido}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="comentarios-form">
        <textarea
          value={nuevoComentario}
          onChange={(e) => setNuevoComentario(e.target.value)}
          placeholder="Escribe un comentario..."
          rows={3}
        />
        <button type="submit" disabled={enviando}>
          {enviando ? "Enviando..." : "Comentar"}
        </button>
      </form>
    </div>
  );
}

export default ComentariosSection;
