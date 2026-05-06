export const API_VERSION = "/api/v1";

export const API_PATHS = {

  // Autenticación
  AUTH_LOGIN: `${API_VERSION}/auth/login`,
  AUTH_ME: `${API_VERSION}/auth/me`,
  AUTH_REFRESH: `${API_VERSION}/auth/refresh`,
  AUTH_LOGOUT: `${API_VERSION}/auth/logout`,

  // Empleados
  EMPLEADOS: `${API_VERSION}/empleados`,
  EMPLEADOS_ME_FOTO: `${API_VERSION}/empleados/me/foto`,
  
  // Productos
  LINEAS: `${API_VERSION}/lineas`,
  LINEA_PRODUCTO: `${API_VERSION}/lineas`,
  FAMILIAS: `${API_VERSION}/familias`,
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

  // Maquinas y centros de Trabajo
  CENTRO_TRABAJO: `${API_VERSION}/centros-trabajo`,
  
  // Operaciones
  OPERACION: `${API_VERSION}/operaciones`,

  // Compras
   COMPRAS: `${API_VERSION}/compras`,
  DETALLES_COMPRA: `${API_VERSION}/detalles-compra`,
  KARDEX: `${API_VERSION}/kardex`,
  
  // Otros módulos
  PROVEEDORES: `${API_VERSION}/proveedores`,
  UNIDADES_MEDIDA: `${API_VERSION}/unidades-medida`,
  CLIENTES: `${API_VERSION}/clientes`,
  COTIZACIONES: `${API_VERSION}/cotizaciones`

    
     
};
