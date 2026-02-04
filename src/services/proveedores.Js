const BASE_URL = 'http://localhost:8081/proveedor'; // Cambia esto si es necesario

export async function obtenerProveedores() {
  const res = await fetch(BASE_URL);
  if (!res.ok) throw new Error('No se pudo obtener los proveedores');
  return res.json();
}

export async function crearProveedor(data) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await leerError(res);
    throw err;
  }
  return res.json();
}

export async function actualizarProveedor(data) {
  const res = await fetch(`${BASE_URL}/${data.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await leerError(res);
    throw err;
  }
  return res.json();
}

export async function eliminarProveedor(id) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    throw await leerError(res);
  }

  if (res.status === 204) return;

  try {
    return await res.json();
  } catch {
    return;
  }
}

async function leerError(res) {
  const err = await res.json();
  return err;
}
