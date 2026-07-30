import { beforeEach, describe, expect, it, vi } from 'vitest';

const { request } = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock('../../../services/api', () => ({ default: request }));

import {
  getUser,
  hasPermission,
  isAuthenticated,
  login
} from './authService';

describe('authService', () => {
  beforeEach(() => {
    request.mockReset();
    localStorage.clear();
  });

  it('guarda ambos tokens al iniciar sesión', async () => {
    request.mockResolvedValue({
      accessToken: 'access-prueba',
      refreshToken: 'refresh-prueba'
    });

    await login({ email: 'qa@mobilesco.test', password: 'secreto' });

    expect(request).toHaveBeenCalledWith('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'qa@mobilesco.test', password: 'secreto' })
    });
    expect(localStorage.getItem('token')).toBe('access-prueba');
    expect(localStorage.getItem('refreshToken')).toBe('refresh-prueba');
  });

  it.each([null, 'null', 'undefined'])('rechaza token local inválido: %s', (token) => {
    if (token !== null) localStorage.setItem('token', token);
    expect(isAuthenticated()).toBe(false);
  });

  it('acepta una sesión con token y recupera al usuario local', () => {
    const user = { id: 7, roles: ['ALMACEN'] };
    localStorage.setItem('token', 'token-prueba');
    localStorage.setItem('user', JSON.stringify(user));

    expect(isAuthenticated()).toBe(true);
    expect(getUser()).toEqual(user);
  });

  it('concede todos los permisos a administración', () => {
    expect(hasPermission({ roles: ['ADMIN'], permisos: [] }, 'VIEW_PURCHASES')).toBe(true);
  });

  it('exige el permiso explícito para usuarios no administrativos', () => {
    const user = { roles: ['ALMACEN'], permisos: ['VIEW_INVENTORY'] };
    expect(hasPermission(user, 'VIEW_INVENTORY')).toBe(true);
    expect(hasPermission(user, 'VIEW_PURCHASES')).toBe(false);
  });
});
