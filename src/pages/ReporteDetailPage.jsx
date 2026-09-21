import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import ComentariosSection from "../components/ComentariosSection";

export default function ReporteDetailPage() {
  const { id } = useParams();

  const [reporte, setReporte] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchReporte();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchReporte() {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get(`/reportes/${id}`);
      setReporte(data);
    } catch {
      setError("No se pudo cargar el reporte.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <p>Cargando...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!reporte) return null;

  return (
    <div>
      <Link to="/reportes">&larr; Volver a reportes</Link>

      <h1>{reporte.titulo}</h1>
      <p className={`badge badge-${reporte.estado}`}>{reporte.estado}</p>
      {reporte.descripcion && <p>{reporte.descripcion}</p>}
      {reporte.torre_unidad && <p>Torre / Unidad: {reporte.torre_unidad}</p>}

      <ComentariosSection reporteId={reporte.id} />
    </div>
  );
}
