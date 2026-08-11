import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useOutletContext } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

const { syncCurrentUser } = vi.hoisted(() => ({
  syncCurrentUser: vi.fn().mockResolvedValue(null)
}));

vi.mock('../components/Sistema/Sidebar', () => ({
  default: () => <aside>Menu de prueba</aside>
}));
vi.mock('../modules/auth/services/authService', () => ({ syncCurrentUser }));

import AppLayout from './AppLayout';

function SessionRevisionProbe() {
  const { authRevision } = useOutletContext();
  return <div>Revision de sesion: {authRevision}</div>;
}

describe('AppLayout', () => {
  it('propaga una nueva revision al contenido activo cuando cambia el usuario', () => {
    render(
      <MemoryRouter initialEntries={['/privado']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/privado" element={<SessionRevisionProbe />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Revision de sesion: 0')).toBeInTheDocument();
    act(() => window.dispatchEvent(new Event('userUpdated')));
    expect(screen.getByText('Revision de sesion: 1')).toBeInTheDocument();
  });

  it('sincroniza al montar y cuando la ventana recupera el foco', () => {
    render(
      <MemoryRouter initialEntries={['/privado']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/privado" element={<SessionRevisionProbe />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(syncCurrentUser).toHaveBeenCalledTimes(1);
    act(() => window.dispatchEvent(new Event('focus')));
    expect(syncCurrentUser).toHaveBeenCalledTimes(2);
  });
});
