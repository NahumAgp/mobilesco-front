import { Navigate } from "react-router-dom";
import { getUser, hasPermission, isAuthenticated } from "../../modules/auth/services/authService";

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
  const permissionAllowed = hasPermission(user, permission);
  const canEnter = permission && allowedRoles.length
    ? roleAllowed || permissionAllowed
    : roleAllowed && permissionAllowed;

  if (!canEnter) {
    return <Navigate to="/tablero" replace />;
  }

  return children;
}
