import { beforeEach, describe, expect, it, vi } from 'vitest';

import request from './api';

function jsonResponse(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(data),
    text: vi.fn().mockResolvedValue(data == null ? '' : JSON.stringify(data))
  };
}

describe('api session refresh', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'access-anterior');
    localStorage.setItem('refreshToken', 'refresh-anterior');
  });

  it('actualiza tokens y usuario local antes de reintentar una peticion expirada', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ message: 'expirado' }, 401))
      .mockResolvedValueOnce(jsonResponse({
        accessToken: 'access-nuevo',
        refreshToken: 'refresh-nuevo'
      }))
      .mockResolvedValueOnce(jsonResponse({
        correo: 'usuario@mobilesco.test',
        roles: ['JEFE_ALMACEN'],
        permisos: ['VIEW_INVENTORY']
      }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    const userUpdated = vi.fn();
    window.addEventListener('userUpdated', userUpdated);

    await expect(request('/api/v1/recurso-protegido')).resolves.toEqual({ ok: true });

    expect(localStorage.getItem('token')).toBe('access-nuevo');
    expect(localStorage.getItem('refreshToken')).toBe('refresh-nuevo');
    expect(JSON.parse(localStorage.getItem('user'))).toMatchObject({
      roles: ['JEFE_ALMACEN'],
      permisos: ['VIEW_INVENTORY']
    });
    expect(userUpdated).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(fetchMock.mock.calls[2][0]).toContain('/api/v1/auth/me');
    expect(fetchMock.mock.calls[3][1].headers.Authorization).toBe('Bearer access-nuevo');

    window.removeEventListener('userUpdated', userUpdated);
    vi.unstubAllGlobals();
  });
});
