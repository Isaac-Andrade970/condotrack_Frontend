import { useEffect, useState } from "react";
import api from "../api/axios";

const emptyForm = { nombre: "", descripcion: "" };

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchCategorias();
  }, []);

  async function fetchCategorias() {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/categorias");
      setCategorias(data);
    } catch {
      setError("No se pudieron cargar las categorías.");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(categoria) {
    setEditingId(categoria.id);
    setForm({ nombre: categoria.nombre, descripcion: categoria.descripcion || "" });
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
        const { data } = await api.patch(`/categorias/${editingId}`, form);
        setCategorias((prev) => prev.map((c) => (c.id === editingId ? data : c)));
      } else {
        const { data } = await api.post("/categorias", form);
        setCategorias((prev) => [...prev, data]);
      }

      cancelEdit();
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      setFormError(apiErrors ? apiErrors.join(", ") : "No se pudo guardar la categoría.");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("¿Eliminar esta categoría?")) return;

    try {
      await api.delete(`/categorias/${id}`);
      setCategorias((prev) => prev.filter((c) => c.id !== id));
    } catch {
      setError("No se pudo eliminar la categoría.");
    }
  }

  return (
    <div>
      <h1>Categorías</h1>

      <form onSubmit={handleSubmit} className="inline-form">
        <input
          type="text"
          placeholder="Nombre"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Descripción"
          value={form.descripcion}
          onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
        />
        <button type="submit">{editingId ? "Guardar" : "Crear"}</button>
        {editingId && (
          <button type="button" onClick={cancelEdit}>
            Cancelar
          </button>
        )}
      </form>

      {formError && <p className="error">{formError}</p>}
      {loading && <p>Cargando...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <ul className="list">
          {categorias.map((categoria) => (
            <li key={categoria.id}>
              <strong>{categoria.nombre}</strong>
              {categoria.descripcion && <span> — {categoria.descripcion}</span>}
              <div className="list-actions">
                <button type="button" onClick={() => startEdit(categoria)}>
                  Editar
                </button>
                <button type="button" onClick={() => handleDelete(categoria.id)}>
                  Eliminar
                </button>
              </div>
            </li>
          ))}
          {categorias.length === 0 && <p>No hay categorías todavía.</p>}
        </ul>
      )}
    </div>
  );
}
