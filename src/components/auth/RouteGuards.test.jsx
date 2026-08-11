import { describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const auth = vi.hoisted(() => ({
  isAuthenticated: vi.fn(),
  getUser: vi.fn(),
  hasPermission: vi.fn()
}));

vi.mock('../../modules/auth/services/authService', () => auth);

import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

function renderRoute(element, initial = '/privado') {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route path="/login" element={<div>Página login</div>} />
        <Route path="/tablero" element={<div>Tablero</div>} />
        <Route path="/privado" element={element} />
      </Routes>
    </MemoryRouter>
  );
}

describe('guardas de rutas', () => {
  it('redirige al login cuando no hay sesión', () => {
    auth.isAuthenticated.mockReturnValue(false);
    renderRoute(<ProtectedRoute><div>Contenido privado</div></ProtectedRoute>);
    expect(screen.getByText('Página login')).toBeInTheDocument();
  });

  it('muestra el contenido protegido con sesión', () => {
    auth.isAuthenticated.mockReturnValue(true);
    renderRoute(<ProtectedRoute><div>Contenido privado</div></ProtectedRoute>);
    expect(screen.getByText('Contenido privado')).toBeInTheDocument();
  });

  it('permite acceso por rol aunque el permiso no esté asignado', () => {
    auth.isAuthenticated.mockReturnValue(true);
    auth.getUser.mockReturnValue({ roles: ['JEFE_ALMACEN'] });
    auth.hasPermission.mockReturnValue(false);
    renderRoute(
      <RoleRoute allowedRoles={['JEFE_ALMACEN']} permission="VIEW_PURCHASES">
        <div>Compras</div>
      </RoleRoute>
    );
    expect(screen.getByText('Compras')).toBeInTheDocument();
  });

  it('muestra acceso denegado cuando faltan rol y permiso', () => {
    auth.isAuthenticated.mockReturnValue(true);
    auth.getUser.mockReturnValue({ roles: ['VENTAS'] });
    auth.hasPermission.mockReturnValue(false);
    renderRoute(
      <RoleRoute allowedRoles={['JEFE_ALMACEN']} permission="VIEW_PURCHASES">
        <div>Compras</div>
      </RoleRoute>
    );
    expect(screen.getByText('Sin permiso para esta vista')).toBeInTheDocument();
  });

  it('exige todos los permisos cuando la ruta recibe una lista', () => {
    auth.isAuthenticated.mockReturnValue(true);
    auth.getUser.mockReturnValue({ roles: ['VENTAS'] });
    auth.hasPermission.mockImplementation((_user, code) => code === 'VIEW_QUOTES');
    renderRoute(
      <RoleRoute permission={['VIEW_QUOTES', 'ACTION_QUOTES_CREATE']}>
        <div>Nueva cotización</div>
      </RoleRoute>
    );
    expect(screen.getByText('Sin permiso para esta vista')).toBeInTheDocument();
  });

  it('recalcula el acceso cuando cambia el usuario de la sesion activa', () => {
    auth.isAuthenticated.mockReturnValue(true);
    let currentUser = { roles: ['VENTAS'], permisos: [] };
    auth.getUser.mockImplementation(() => currentUser);
    auth.hasPermission.mockImplementation((user, code) => user?.permisos?.includes(code));

    renderRoute(
      <RoleRoute permission="VIEW_PURCHASES">
        <div>Compras actualizadas</div>
      </RoleRoute>
    );
    expect(screen.getByText('Sin permiso para esta vista')).toBeInTheDocument();

    currentUser = { roles: ['VENTAS'], permisos: ['VIEW_PURCHASES'] };
    act(() => window.dispatchEvent(new Event('userUpdated')));

    expect(screen.getByText('Compras actualizadas')).toBeInTheDocument();
  });
});
