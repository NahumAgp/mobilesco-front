import { Navigate } from "react-router-dom";
import { getUser, hasPermission, isAuthenticated } from "../../modules/auth/services/authService";
import AccessDenied from "./AccessDenied";

function hasAllowedRole(user, allowedRoles = []) {
  if (!allowedRoles.length) {
    return true;
  }

  const userRoles = user?.roles || [];
  return userRoles.some((role) => allowedRoles.includes(role));
}

export default function RoleRoute({ children, allowedRoles = [], permission }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const user = getUser();

  const roleAllowed = hasAllowedRole(user, allowedRoles);
  const requiredPermissions = Array.isArray(permission) ? permission : permission ? [permission] : [];
  const permissionAllowed = requiredPermissions.every((code) => hasPermission(user, code));
  const canEnter = permission && allowedRoles.length
    ? roleAllowed || permissionAllowed
    : roleAllowed && permissionAllowed;

  if (!canEnter) {
    return <AccessDenied />;
  }

  return children;
}
