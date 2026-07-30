import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const auth = vi.hoisted(() => ({
  login: vi.fn(),
  getCurrentUser: vi.fn(),
  isAuthenticated: vi.fn()
}));

vi.mock('../services/authService', () => auth);

import Login from './Login';

describe('Login', () => {
  it('autentica, conserva el usuario y navega al tablero', async () => {
    const user = userEvent.setup();
    auth.isAuthenticated.mockReturnValue(false);
    auth.login.mockResolvedValue({ accessToken: 'token-prueba' });
    auth.getCurrentUser.mockResolvedValue({
      id: 21,
      email: 'compras@mobilesco.test',
      roles: ['JEFE_ALMACEN'],
      permisos: ['VIEW_PURCHASES']
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/tablero" element={<h1>Tablero de prueba</h1>} />
        </Routes>
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText('Correo'), 'compras@mobilesco.test');
    await user.type(screen.getByLabelText(/Contrase/), 'clave-segura');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Tablero de prueba')).toBeInTheDocument();
    expect(auth.login).toHaveBeenCalledWith({
      email: 'compras@mobilesco.test',
      password: 'clave-segura'
    });
    expect(JSON.parse(localStorage.getItem('user'))).toMatchObject({
      roles: ['JEFE_ALMACEN']
    });
  });

  it('muestra el error del servidor y permite reintentar', async () => {
    const user = userEvent.setup();
    auth.isAuthenticated.mockReturnValue(false);
    auth.login.mockRejectedValue(new Error('Credenciales inválidas'));

    render(<MemoryRouter><Login /></MemoryRouter>);
    await user.type(screen.getByLabelText('Correo'), 'incorrecto@mobilesco.test');
    await user.type(screen.getByLabelText(/Contrase/), 'incorrecta');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Credenciales inválidas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled();
  });
});
