export const API_VERSION = "/api/v1";

export const API_PATHS = {

  // Autenticación
  AUTH_LOGIN: `${API_VERSION}/auth/login`,
  AUTH_ME: `${API_VERSION}/auth/me`,
  AUTH_REFRESH: `${API_VERSION}/auth/refresh`,
  AUTH_LOGOUT: `${API_VERSION}/auth/logout`,
  AUTH_REGISTER: `${API_VERSION}/auth/register`,
  AUTH_ROLES: `${API_VERSION}/auth/roles`,
  AUTH_PERMISOS: `${API_VERSION}/auth/permisos`,
  AUTH_ROLES_CONFIG: `${API_VERSION}/auth/roles-config`,
  AUTH_USUARIOS: `${API_VERSION}/auth/usuarios`,
  AUTH_INVITACIONES: `${API_VERSION}/auth/invitaciones`,
  AUTH_PENDIENTES: `${API_VERSION}/auth/usuarios-pendientes`,

  // Empleados
  EMPLEADOS: `${API_VERSION}/empleados`,
  EMPLEADOS_ME_FOTO: `${API_VERSION}/empleados/me/foto`,
  AREAS_TRABAJO: `${API_VERSION}/areas-trabajo`,
  
  // Productos
  LINEAS: `${API_VERSION}/lineas`,
  LINEA_PRODUCTO: `${API_VERSION}/lineas`,
  FAMILIAS: `${API_VERSION}/familias`,
  SUBFAMILIAS: `${API_VERSION}/subfamilias`,
  MODELOS: `${API_VERSION}/modelos`,
  VARIANTES: `${API_VERSION}/productos`,
  CATEGORIAS: `${API_VERSION}/categorias`,
  NIVELES: `${API_VERSION}/niveles`,
  CATEGORIA_REAL: `${API_VERSION}/categorias`,
  COLORES: `${API_VERSION}/colores`,
  IMAGENES: `${API_VERSION}/imagenes`,

  PRODUCTOS: `${API_VERSION}/productos`,
  MATERIALES: `${API_VERSION}/materiales`,
  // Insumos
  INSUMOS: `${API_VERSION}/insumos`,
  TIPOS_INSUMO: `${API_VERSION}/tipos-insumo`,

  // Maquinas y centros de Trabajo
  CENTRO_TRABAJO: `${API_VERSION}/centros-trabajo`,
  
  // Operaciones
  OPERACION: `${API_VERSION}/operaciones`,
  CIF: `${API_VERSION}/cif`,

  // Compras
   COMPRAS: `${API_VERSION}/compras`,
  CUENTAS_POR_PAGAR: `${API_VERSION}/cuentas-por-pagar`,
  DETALLES_COMPRA: `${API_VERSION}/detalles-compra`,
  SALIDAS_INSUMOS: `${API_VERSION}/salidas-insumos`,
  REQUISICIONES_ALMACEN: `${API_VERSION}/requisiciones-almacen`,
  NOTIFICACIONES: `${API_VERSION}/notificaciones`,
  KARDEX: `${API_VERSION}/kardex`,
  
  // Otros módulos
  PROVEEDORES: `${API_VERSION}/proveedores`,
  UNIDADES_MEDIDA: `${API_VERSION}/unidades-medida`,
  CLIENTES: `${API_VERSION}/clientes`,
  COTIZACIONES: `${API_VERSION}/cotizaciones`,
  ORDENES_PRODUCCION: `${API_VERSION}/ordenes-produccion`,
  TABLERO: `${API_VERSION}/tablero`,

  // Catalogo publico (sin autenticacion; lo consume la web publica)
  PUBLIC_CATALOGO: `${API_VERSION}/public/catalogo`,
  PUBLIC_CATALOGO_MODELOS: `${API_VERSION}/public/catalogo/modelos`,
  PUBLIC_CATALOGO_FACETAS: `${API_VERSION}/public/catalogo/facetas`

};
