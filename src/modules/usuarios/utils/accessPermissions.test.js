import { describe, expect, it } from 'vitest';

import {
  buildAccessUserPatch,
  collectEffectivePermissionCodes,
  collectInheritedPermissionCodes,
  ensurePermissionDependencies,
  sameCodeSet,
  togglePermissionWithDependencies
} from './accessPermissions';

const permissions = [
  { code: 'VIEW_INVENTORY', tipo: 'VIEW', vistaRequerida: null },
  { code: 'ACTION_INVENTORY_EDIT', tipo: 'ACTION', vistaRequerida: 'VIEW_INVENTORY' },
  { code: 'VIEW_USERS', tipo: 'VIEW', vistaRequerida: null }
];

describe('accessPermissions', () => {
  it('calcula heredados desde todos los roles seleccionados sin duplicados', () => {
    expect(collectInheritedPermissionCodes(
      ['ALMACEN', 'AUDITOR'],
      [
        { name: 'ALMACEN', permisos: ['VIEW_INVENTORY', 'ACTION_INVENTORY_EDIT'] },
        { name: 'AUDITOR', permisos: ['VIEW_INVENTORY', 'VIEW_USERS'] },
        { name: 'VENTAS', permisos: ['VIEW_USERS'] }
      ]
    )).toEqual(['ACTION_INVENTORY_EDIT', 'VIEW_INVENTORY', 'VIEW_USERS']);
  });

  it('solo considera efectiva una accion cuando tambien existe su vista', () => {
    expect(collectEffectivePermissionCodes(
      ['ACTION_INVENTORY_EDIT'],
      [],
      permissions
    )).toEqual([]);

    expect(collectEffectivePermissionCodes(
      ['ACTION_INVENTORY_EDIT'],
      ['VIEW_INVENTORY'],
      permissions
    )).toEqual(['ACTION_INVENTORY_EDIT', 'VIEW_INVENTORY']);
  });

  it('agrega automaticamente la vista requerida al seleccionar una accion', () => {
    expect(togglePermissionWithDependencies(
      [],
      'ACTION_INVENTORY_EDIT',
      permissions
    )).toEqual(['ACTION_INVENTORY_EDIT', 'VIEW_INVENTORY']);
  });

  it('no duplica como directo un requisito que ya viene heredado', () => {
    expect(togglePermissionWithDependencies(
      [],
      'ACTION_INVENTORY_EDIT',
      permissions,
      ['VIEW_INVENTORY']
    )).toEqual(['ACTION_INVENTORY_EDIT']);
  });

  it('retira acciones dependientes al quitar una vista directa', () => {
    expect(togglePermissionWithDependencies(
      ['VIEW_INVENTORY', 'ACTION_INVENTORY_EDIT'],
      'VIEW_INVENTORY',
      permissions
    )).toEqual([]);
  });

  it('conserva acciones al quitar una vista directa si la vista tambien es heredada', () => {
    expect(togglePermissionWithDependencies(
      ['VIEW_INVENTORY', 'ACTION_INVENTORY_EDIT'],
      'VIEW_INVENTORY',
      permissions,
      ['VIEW_INVENTORY']
    )).toEqual(['ACTION_INVENTORY_EDIT']);
  });

  it('completa requisitos que dejan de venir de un rol', () => {
    expect(ensurePermissionDependencies(
      ['ACTION_INVENTORY_EDIT'],
      [],
      permissions
    )).toEqual(['ACTION_INVENTORY_EDIT', 'VIEW_INVENTORY']);
  });

  it('compara colecciones de codigos sin depender del orden', () => {
    expect(sameCodeSet(['VIEW_USERS', 'VIEW_INVENTORY'], ['VIEW_INVENTORY', 'VIEW_USERS'])).toBe(true);
    expect(sameCodeSet(['VIEW_USERS'], ['VIEW_INVENTORY'])).toBe(false);
  });

  it('construye un PATCH solo con los campos realmente modificados y autorizados', () => {
    expect(buildAccessUserPatch(
      {
        roles: ['AUDITOR'],
        permisosDirectos: ['VIEW_USERS'],
        enabled: true,
        locked: false
      },
      {
        roles: ['ALMACEN'],
        permisosDirectos: ['VIEW_USERS'],
        enabled: true,
        locked: false
      },
      {
        manageRoles: true,
        manageDirectPermissions: true,
        manageStatus: true
      }
    )).toEqual({ roles: ['AUDITOR'] });
  });

  it('no incluye en el PATCH un campo que el actor no puede administrar', () => {
    expect(buildAccessUserPatch(
      {
        roles: ['AUDITOR'],
        permisosDirectos: ['VIEW_USERS'],
        enabled: false,
        locked: false
      },
      {
        roles: ['ALMACEN'],
        permisosDirectos: [],
        enabled: true,
        locked: false
      },
      {
        manageRoles: true,
        manageDirectPermissions: false,
        manageStatus: false
      }
    )).toEqual({ roles: ['AUDITOR'] });
  });
});
