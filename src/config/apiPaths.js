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
  PRODUCTOS: `${API_VERSION}/productos`,
  FAMILIAS: `${API_VERSION}/familias`,
  LINEA_PRODUCTO: `${API_VERSION}/lineas-producto`,
  CATEGORIAS: `${API_VERSION}/categorias`,
  MATERIALES: `${API_VERSION}/materiales`,
  TIPO_PRODUCTO: `${API_VERSION}/tipos-producto`,

  // Insumos
  INSUMOS: `${API_VERSION}/insumos`,

  // Maquinas y centros de Trabajo
  CENTRO_TRABAJO: `${API_VERSION}/centros-trabajo`,
  
  // Operaciones
  OPERACION: `${API_VERSION}/operaciones`,

  // Compras
   COMPRAS: `${API_VERSION}/compras`,
  
  // Otros módulos
  PROVEEDORES: `${API_VERSION}/proveedores`,
  UNIDADES_MEDIDA: `${API_VERSION}/unidades-medida`,
  PRODUCTOS: `${API_VERSION}/productos`,
  CLIENTES: `${API_VERSION}/clientes`,
  COTIZACIONES: `${API_VERSION}/cotizaciones`

    
     
};