import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Protege rutas según autenticación y rol del usuario
// - Si no hay sesión activa → redirige a /login
// - Si se especifican allowedRoles y el usuario no tiene ese rol → redirige a /
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  // Mientras se verifica la sesión, no renderiza nada
  if (loading) return null;

  // No autenticado
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Autenticado pero sin el rol requerido
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // Autorizado
  return children;
}
