// ⚠️  IMPORTANTE: En celular físico/emulador "localhost" NO funciona.
//     Usa la IP local de tu PC (la misma que imprime el backend al iniciar).
//     Ejemplo: http://192.168.0.144:3000/api
//     Cámbiala en el archivo .env → EXPO_PUBLIC_API_URL

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.144:3000/api';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint);
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiService();

// ── Productos ─────────────────────────────────────────────────────────────────
export const productosApi = {
  getAll: () => api.get('/productos'),
  getDisponibles: () => api.get('/productos/disponibles'),
  getPopulares: () => api.get('/productos/populares'),
  getById: (id: string) => api.get(`/productos/${id}`),
  getByCategoria: (idCategoria: string) => api.get(`/productos/categoria/${idCategoria}`),
  search: (term: string) => api.get(`/productos/search?term=${encodeURIComponent(term)}`),
  create: (data: any) => api.post('/productos', data),
  update: (id: string, data: any) => api.put(`/productos/${id}`, data),
  delete: (id: string) => api.delete(`/productos/${id}`),
};

// ── Categorías ────────────────────────────────────────────────────────────────
export const categoriasApi = {
  getAll: () => api.get('/categorias'),
  getById: (id: string) => api.get(`/categorias/${id}`),
  getProductosByCategoria: (id: string) => api.get(`/categorias/${id}/productos`),
  create: (data: any) => api.post('/categorias', data),
  update: (id: string, data: any) => api.put(`/categorias/${id}`, data),
  delete: (id: string) => api.delete(`/categorias/${id}`),
};

// ── Usuarios ──────────────────────────────────────────────────────────────────
export const usuariosApi = {
  getAll: () => api.get('/usuarios'),
  getById: (id: string) => api.get(`/usuarios/${id}`),
  getByTelefono: (telefono: string) => api.get(`/usuarios/telefono/${telefono}`),
  create: (data: any) => api.post('/usuarios', data),
  update: (id: string, data: any) => api.put(`/usuarios/${id}`, data),
  delete: (id: string) => api.delete(`/usuarios/${id}`),
};

// ── Pedidos ───────────────────────────────────────────────────────────────────
export const pedidosApi = {
  getAll: () => api.get('/pedidos'),
  getById: (id: string) => api.get(`/pedidos/${id}`),
  getByUsuario: (idUsuario: string) => api.get(`/pedidos/usuario/${idUsuario}`),
  getStats: () => api.get('/pedidos/stats'),
  create: (data: any) => api.post('/pedidos', data),
  updateEstado: (id: string, estado: string) => api.put(`/pedidos/${id}/estado`, { estado }),
  delete: (id: string) => api.delete(`/pedidos/${id}`),
};

// ── Carrito ───────────────────────────────────────────────────────────────────
export const carritoApi = {
  getAll: () => api.get('/carrito'),
  getById: (id: string) => api.get(`/carrito/${id}`),
  getByUsuario: (idUsuario: string) => api.get(`/carrito/usuario/${idUsuario}`),
  getTotales: (idUsuario: string) => api.get(`/carrito/usuario/${idUsuario}/totales`),
  create: (data: any) => api.post('/carrito', data),
  updateCantidad: (id: string, cantidad: number) =>
    api.put(`/carrito/${id}/cantidad`, { cantidad }),
  delete: (id: string) => api.delete(`/carrito/${id}`),
  vaciarCarrito: (idUsuario: string) => api.delete(`/carrito/usuario/${idUsuario}/vaciar`),
};

// ── Banners ───────────────────────────────────────────────────────────────────
export const bannersApi = {
  getAll: () => api.get('/banners'),
  getById: (id: string) => api.get(`/banners/${id}`),
  create: (data: any) => api.post('/banners', data),
  update: (id: string, data: any) => api.put(`/banners/${id}`, data),
  delete: (id: string) => api.delete(`/banners/${id}`),
};

// ── Cupones ───────────────────────────────────────────────────────────────────
export const cuponesApi = {
  getAll: () => api.get('/cupones'),
  getById: (id: string) => api.get(`/cupones/${id}`),
  getByCodigo: (codigo: string) => api.get(`/cupones/codigo/${codigo}`),
  validar: (codigo: string, total: number) => api.post('/cupones/validar', { codigo, total }),
  create: (data: any) => api.post('/cupones', data),
  update: (id: string, data: any) => api.put(`/cupones/${id}`, data),
  delete: (id: string) => api.delete(`/cupones/${id}`),
};

// ── Domicilios ────────────────────────────────────────────────────────────────
export const domiciliosApi = {
  getAll: () => api.get('/domicilios'),
  getById: (id: string) => api.get(`/domicilios/${id}`),
  create: (data: any) => api.post('/domicilios', data),
  update: (id: string, data: any) => api.put(`/domicilios/${id}`, data),
  delete: (id: string) => api.delete(`/domicilios/${id}`),
};

// ── Calificaciones ────────────────────────────────────────────────────────────
export const calificacionesApi = {
  getAll: () => api.get('/calificaciones'),
  getById: (id: string) => api.get(`/calificaciones/${id}`),
  getByProducto: (idProducto: string) => api.get(`/calificaciones/producto/${idProducto}`),
  getByUsuario: (idUsuario: string) => api.get(`/calificaciones/usuario/${idUsuario}`),
  getPromedioByProducto: (idProducto: string) =>
    api.get(`/calificaciones/producto/${idProducto}/promedio`),
  create: (data: any) => api.post('/calificaciones', data),
  update: (id: string, data: any) => api.put(`/calificaciones/${id}`, data),
  delete: (id: string) => api.delete(`/calificaciones/${id}`),
};

// ── Favoritos ─────────────────────────────────────────────────────────────────
export const favoritosApi = {
  getAll: () => api.get('/favoritos'),
  getById: (id: string) => api.get(`/favoritos/${id}`),
  getByUsuario: (idUsuario: string) => api.get(`/favoritos/usuario/${idUsuario}`),
  getByProducto: (idProducto: string) => api.get(`/favoritos/producto/${idProducto}`),
  esFavorito: (idUsuario: string, idProducto: string) =>
    api.get(`/favoritos/usuario/${idUsuario}/producto/${idProducto}/es-favorito`),
  create: (data: any) => api.post('/favoritos', data),
  toggle: (data: any) => api.post('/favoritos/toggle', data),
  delete: (id: string) => api.delete(`/favoritos/${id}`),
  removeFavorito: (idUsuario: string, idProducto: string) =>
    api.delete(`/favoritos/usuario/${idUsuario}/producto/${idProducto}`),
};

// ── Autenticación ─────────────────────────────────────────────────────────────
// Usa IP local de tu PC, no "localhost" (el celular no puede resolverlo)
const getApiUrl = () => {
  const url = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.144:3000/api';
  return url;
};

export const authApi = {
  login: async (credentials: { correo: string; password: string }) => {

    const url = `${getApiUrl()}/auth/login`;
    console.log('[authApi.login] Intentando conectar a:', url);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      console.log('[authApi.login] Status:', response.status);
      const json = await response.json();
      console.log('[authApi.login] Respuesta recibida:', json);
      return json;
    } catch (err: any) {
      console.error('[authApi.login] ERROR CRÍTICO:', err.message);
      throw err;
    }
  },


  register: async (userData: {
    nombre: string;
    telefono: string;
    correo: string;
    password: string;
    direccion?: string;
    foto?: string;
  }) => {
    const url = `${getApiUrl()}/auth/register`;
    console.log('[authApi.register] Intentando conectar a:', url);
    console.log('[authApi.register] Datos enviados:', { ...userData, password: '***' });
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      
      console.log('[authApi.register] Status:', response.status);
      const json = await response.json();
      console.log('[authApi.register] Respuesta recibida:', json);
      return json;
    } catch (err: any) {
      console.error('[authApi.register] ERROR CRÍTICO:', err.message);
      console.error('[authApi.register] Si ves "Network request failed", es probable que la IP ' + getApiUrl() + ' sea incorrecta o el backend esté apagado.');
      throw err;
    }
  },


  getProfile: async (token: string) => {
    const url = `${getApiUrl()}/auth/profile`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    return response.json();
  },
};
