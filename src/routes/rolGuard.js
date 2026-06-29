export const canManageProducts = (role) => ['admin', 'empleado'].includes(role);
export const canManageUsers = (role) => role === 'admin';
export const canViewOrders = (role) => ['admin', 'empleado', 'cliente'].includes(role);
export const canManageOrders = (role) => ['admin', 'empleado'].includes(role);
