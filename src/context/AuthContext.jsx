import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext(null);

const USERS_STORAGE_KEY = 'peter-market-users';

const MOCK_USERS = [
  { id: 1, name: 'Admin Peter', email: 'admin@petermarket.pe', password: 'admin123', role: 'admin' },
  { id: 2, name: 'Empleado Juan', email: 'empleado@petermarket.pe', password: 'empleado123', role: 'empleado' },
  { id: 3, name: 'Cliente María', email: 'cliente@petermarket.pe', password: 'cliente123', role: 'cliente' },
];

function loadAllUsers() {
  try {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  const initial = MOCK_USERS.map(({ password, ...rest }) => rest);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

function saveAllUsers(users) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

// Genera un token JWT simulado (solo codifica payload en base64)
function generateMockToken(user) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400, // 24h
    })
  );
  return `${header}.${payload}.mock_signature`;
}

// Decodifica el payload de un token mock sin verificar firma
function decodeMockToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1]));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Al montar, intenta recuperar sesión desde localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = decodeMockToken(token);
      if (payload && payload.exp > Math.floor(Date.now() / 1000)) {
        setUser({
          id: payload.sub,
          name: payload.name,
          email: payload.email,
          role: payload.role,
        });
      } else {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  // Obtiene todos los usuarios (mock + registrados)
  const getAllUsers = () => loadAllUsers();

  // Login: busca en MOCK_USERS y en usuarios almacenados
  const login = async (email, password) => {
    await new Promise((r) => setTimeout(r, 600));

    const allUsers = [...MOCK_USERS, ...loadAllUsers().filter((u) => u.id > 3)];
    const found = allUsers.find((u) => u.email === email && u.password === password);

    if (!found) {
      throw new Error('Credenciales inválidas');
    }

    const token = generateMockToken(found);
    localStorage.setItem('token', token);

    const userData = { id: found.id, name: found.name, email: found.email, role: found.role };
    setUser(userData);

    return { token, user: userData };
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // Registro: guarda el nuevo usuario en localStorage
  const register = async ({ name, email, password }) => {
    await new Promise((r) => setTimeout(r, 600));
    const storedUsers = loadAllUsers();
    const newUser = { id: Date.now(), name, email, role: 'cliente' };
    storedUsers.push(newUser);
    saveAllUsers(storedUsers);

    const token = generateMockToken({ id: newUser.id, name, email, role: 'cliente' });
    localStorage.setItem('token', token);
    const userData = { id: newUser.id, name, email, role: 'cliente' };
    setUser(userData);
    return { token, user: userData };
  };

  const updateProfile = async ({ name, email, password }) => {
    await new Promise((r) => setTimeout(r, 300));
    const token = localStorage.getItem('token');
    const payload = token ? decodeMockToken(token) : null;
    const newToken = generateMockToken({
      id: user.id,
      name,
      email,
      role: user.role,
    });
    localStorage.setItem('token', newToken);
    setUser((prev) => ({ ...prev, name, email }));
    return { success: true };
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, getAllUsers }}>
      {children}
    </AuthContext.Provider>
  );
}
