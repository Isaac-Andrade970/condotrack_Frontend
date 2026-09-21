import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

const emptyForm = { titulo: "", descripcion: "", torre_unidad: "", categoria_id: "" };
const ESTADOS = ["pendiente", "en_progreso", "resuelto"];

export default function ReportesPage() {
  const [reportes, setReportes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    setError("");

    try {
      const [reportesRes, categoriasRes] = await Promise.all([
        api.get("/reportes"),
        api.get("/categorias"),
      ]);
      setReportes(reportesRes.data);
      setCategorias(categoriasRes.data);
    } catch {
      setError("No se pudieron cargar los reportes.");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(reporte) {
    setEditingId(reporte.id);
    setForm({
      titulo: reporte.titulo,
      descripcion: reporte.descripcion || "",
      torre_unidad: reporte.torre_unidad || "",
      categoria_id: reporte.categoria_id,
      estado: reporte.estado,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    try {
      if (editingId) {
        const { data } = await api.patch(`/reportes/${editingId}`, form);
        setReportes((prev) => prev.map((r) => (r.id === editingId ? data : r)));
      } else {
        const { data } = await api.post("/reportes", form);
        setReportes((prev) => [...prev, data]);
      }

      cancelEdit();
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      setFormError(apiErrors ? apiErrors.join(", ") : "No se pudo guardar el reporte.");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("¿Eliminar este reporte?")) return;

    try {
      await api.delete(`/reportes/${id}`);
      setReportes((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setError("No se pudo eliminar el reporte.");
    }
  }

  function categoriaNombre(id) {
    return categorias.find((c) => c.id === id)?.nombre || "—";
  }

  return (
    <div>
      <h1>Reportes</h1>

      <form onSubmit={handleSubmit} className="stacked-form">
        <input
          type="text"
          placeholder="Título"
          value={form.titulo}
          onChange={(e) => setForm({ ...form, titulo: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Descripción"
          value={form.descripcion}
          onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
        />
        <input
          type="text"
          placeholder="Torre / Unidad"
          value={form.torre_unidad}
          onChange={(e) => setForm({ ...form, torre_unidad: e.target.value })}
        />
        <select
          value={form.categoria_id}
          onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}
          required
        >
          <option value="" disabled>
            Selecciona categoría
          </option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        {editingId && (
          <select
            value={form.estado}
            onChange={(e) => setForm({ ...form, estado: e.target.value })}
          >
            {ESTADOS.map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </select>
        )}
        <div>
          <button type="submit">{editingId ? "Guardar" : "Crear reporte"}</button>
          {editingId && (
            <button type="button" onClick={cancelEdit}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      {formError && <p className="error">{formError}</p>}
      {loading && <p>Cargando...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <ul className="list">
          {reportes.map((reporte) => (
            <li key={reporte.id}>
              <div>
                <Link to={`/reportes/${reporte.id}`}>
                  <strong>{reporte.titulo}</strong>
                </Link>
                <span className={`badge badge-${reporte.estado}`}>{reporte.estado}</span>
                <div>
                  {categoriaNombre(reporte.categoria_id)}
                  {reporte.torre_unidad && ` · ${reporte.torre_unidad}`}
                </div>
              </div>
              <div className="list-actions">
                <button type="button" onClick={() => startEdit(reporte)}>
                  Editar
                </button>
                <button type="button" onClick={() => handleDelete(reporte.id)}>
                  Eliminar
                </button>
              </div>
            </li>
          ))}
          {reportes.length === 0 && <p>No hay reportes todavía.</p>}
        </ul>
      )}
    </div>
  );
}
