import { cloneElement, isValidElement, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useOutletContext } from "react-router-dom";
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
  const outletContext = useOutletContext();
  const [user, setUser] = useState(() => getUser());
  const [localRevision, setLocalRevision] = useState(0);

  useEffect(() => {
    const handleUserUpdated = () => {
      setUser(getUser());
      setLocalRevision((current) => current + 1);
    };
    window.addEventListener("userUpdated", handleUserUpdated);
    return () => window.removeEventListener("userUpdated", handleUserUpdated);
  }, []);

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const roleAllowed = hasAllowedRole(user, allowedRoles);
  const requiredPermissions = Array.isArray(permission) ? permission : permission ? [permission] : [];
  const permissionAllowed = requiredPermissions.every((code) => hasPermission(user, code));
  const canEnter = permission && allowedRoles.length
    ? roleAllowed || permissionAllowed
    : roleAllowed && permissionAllowed;

  if (!canEnter) {
    return <AccessDenied />;
  }

  if (isValidElement(children) && typeof children.type !== "string") {
    return cloneElement(children, {
      authSessionRevision: `${outletContext?.authRevision || 0}:${localRevision}`
    });
  }

  return children;
}
