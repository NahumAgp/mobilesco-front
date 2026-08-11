import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.hoisted(() => ({
  createInvitation: vi.fn(),
  createRole: vi.fn(),
  deactivateAccessUser: vi.fn(),
  getAccessUsers: vi.fn(),
  getAvailableRoles: vi.fn(),
  getPermissions: vi.fn(),
  getRolesConfig: vi.fn(),
  updateRole: vi.fn(),
  updateAccessUser: vi.fn(),
  getUser: vi.fn(),
  hasPermission: vi.fn()
}));

vi.mock('../../auth/services/authService', () => auth);

import UsuariosAccesoPage from './UsuariosAccesoPage';

const roleConfigs = [
  {
    id: 1,
    name: 'ADMIN',
    permisos: ['VIEW_EMPLOYEES', 'ACTION_EMPLOYEES_EDIT']
  },
  {
    id: 2,
    name: 'EMPLOYEE',
    permisos: []
  }
];

const accessUser = {
  idUsuario: 42,
  correo: 'nancy@mobilesco.test',
  nombre: 'Nancy',
  apellidoPaterno: 'Vallarta',
  roles: ['ADMIN'],
  permisosDirectos: [],
  permisosHeredados: ['VIEW_EMPLOYEES', 'ACTION_EMPLOYEES_EDIT'],
  permisosEfectivos: ['VIEW_EMPLOYEES', 'ACTION_EMPLOYEES_EDIT'],
  enabled: true,
  locked: false,
  estadoCuenta: 'ACTIVE'
};

describe('UsuariosAccesoPage', () => {
  beforeEach(() => {
    auth.getUser.mockReturnValue({
      correo: 'admin@mobilesco.test',
      roles: ['ADMIN'],
      permisos: []
    });
    auth.hasPermission.mockReturnValue(true);
    auth.getAvailableRoles.mockResolvedValue(['ADMIN', 'EMPLOYEE']);
    auth.getPermissions.mockResolvedValue([
      {
        code: 'VIEW_EMPLOYEES',
        nombre: 'Ver empleados',
        modulo: 'Administracion',
        tipo: 'VIEW',
        vistaRequerida: null
      },
      {
        code: 'ACTION_EMPLOYEES_EDIT',
        nombre: 'Editar empleados',
        modulo: 'Administracion',
        tipo: 'ACTION',
        vistaRequerida: 'VIEW_EMPLOYEES'
      }
    ]);
    auth.getRolesConfig.mockImplementation((params) => Promise.resolve(
      params?.page !== undefined
        ? {
            content: roleConfigs,
            page: 0,
            size: 6,
            totalElements: 2,
            totalPages: 1
          }
        : roleConfigs
    ));
    auth.getAccessUsers.mockResolvedValue({
      content: [accessUser],
      page: 0,
      size: 10,
      totalElements: 1,
      totalPages: 1
    });
    auth.updateAccessUser.mockResolvedValue({
      ...accessUser,
      roles: ['EMPLOYEE'],
      permisosHeredados: [],
      permisosEfectivos: []
    });
  });

  it('recalcula checks y contador al cambiar roles y envia solo el rol modificado', async () => {
    const user = userEvent.setup();
    render(<UsuariosAccesoPage />);

    await user.click(await screen.findByRole('button', { name: 'Editar accesos' }));

    expect(screen.getByText('2/2')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Ver empleados/ })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Editar empleados/ })).toBeChecked();

    await user.click(screen.getByRole('checkbox', { name: 'EMPLOYEE' }));
    await user.click(screen.getByRole('checkbox', { name: 'ADMIN' }));

    expect(screen.getByText('0/2')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Ver empleados/ })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Editar empleados/ })).not.toBeChecked();

    await user.click(screen.getByRole('button', { name: 'Guardar accesos' }));

    await waitFor(() => {
      expect(auth.updateAccessUser).toHaveBeenCalledWith(42, {
        roles: ['EMPLOYEE']
      });
    });
  });
});
