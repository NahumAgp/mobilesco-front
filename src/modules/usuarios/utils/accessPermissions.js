function toCodeSet(codes = []) {
  return new Set((codes || []).filter(Boolean));
}

function buildPermissionMap(permissions = []) {
  return new Map((permissions || []).map((permission) => [permission.code, permission]));
}

export function sameCodeSet(left = [], right = []) {
  const leftSet = toCodeSet(left);
  const rightSet = toCodeSet(right);

  return leftSet.size === rightSet.size
    && [...leftSet].every((code) => rightSet.has(code));
}

export function buildAccessUserPatch(draft, original, capabilities) {
  const payload = {};

  if (capabilities.manageRoles && !sameCodeSet(draft.roles, original.roles || [])) {
    payload.roles = draft.roles;
  }
  if (
    capabilities.manageDirectPermissions
    && !sameCodeSet(draft.permisosDirectos, original.permisosDirectos || [])
  ) {
    payload.permisosDirectos = draft.permisosDirectos;
  }
  if (capabilities.manageStatus && draft.enabled !== Boolean(original.enabled)) {
    payload.enabled = draft.enabled;
  }
  if (capabilities.manageStatus && draft.locked !== Boolean(original.locked)) {
    payload.locked = draft.locked;
  }

  return payload;
}

export function collectInheritedPermissionCodes(roleNames = [], roleConfigs = []) {
  const selectedRoles = toCodeSet(roleNames);
  const inherited = new Set();

  (roleConfigs || []).forEach((role) => {
    if (!selectedRoles.has(role.name)) {
      return;
    }

    (role.permisos || []).forEach((code) => inherited.add(code));
  });

  return [...inherited].sort();
}

export function collectEffectivePermissionCodes(
  directCodes = [],
  inheritedCodes = [],
  permissions = []
) {
  const assigned = new Set([...directCodes, ...inheritedCodes].filter(Boolean));
  const permissionMap = buildPermissionMap(permissions);

  return [...assigned]
    .filter((code) => {
      const permission = permissionMap.get(code);
      if (!permission) {
        return false;
      }

      return !permission.vistaRequerida || assigned.has(permission.vistaRequerida);
    })
    .sort();
}

export function ensurePermissionDependencies(
  selectedCodes = [],
  inheritedCodes = [],
  permissions = []
) {
  const selected = toCodeSet(selectedCodes);
  const inherited = toCodeSet(inheritedCodes);
  const permissionMap = buildPermissionMap(permissions);

  [...selected].forEach((code) => {
    const requiredView = permissionMap.get(code)?.vistaRequerida;
    if (requiredView && !selected.has(requiredView) && !inherited.has(requiredView)) {
      selected.add(requiredView);
    }
  });

  return [...selected].sort();
}

export function togglePermissionWithDependencies(
  selectedCodes = [],
  code,
  permissions = [],
  inheritedCodes = []
) {
  const selected = toCodeSet(selectedCodes);
  const inherited = toCodeSet(inheritedCodes);
  const permissionMap = buildPermissionMap(permissions);

  if (selected.has(code)) {
    selected.delete(code);

    if (!inherited.has(code)) {
      permissionMap.forEach((permission, permissionCode) => {
        if (permission.vistaRequerida === code) {
          selected.delete(permissionCode);
        }
      });
    }
  } else {
    selected.add(code);
    const requiredView = permissionMap.get(code)?.vistaRequerida;
    if (requiredView && !inherited.has(requiredView)) {
      selected.add(requiredView);
    }
  }

  return [...selected].sort();
}
