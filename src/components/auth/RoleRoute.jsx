import { Navigate } from "react-router-dom";
import { getUser, isAuthenticated } from "../../services/authService";

function hasAllowedRole(user, allowedRoles = []) {
  if (!allowedRoles.length) {
    return true;
  }

  const userRoles = user?.roles || [];
  return userRoles.some((role) => allowedRoles.includes(role));
}

export default function RoleRoute({ children, allowedRoles = [] }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const user = getUser();

  if (!hasAllowedRole(user, allowedRoles)) {
    return <Navigate to="/tablero" replace />;
  }

  return children;
}
