export interface Usuario {
  id?: number;
  nombre: string;
  telefono: string;
  correo?: string;
  direccion?: string;
  foto?: string;
  rol: number; // 1: Usuario, 2: Admin
  fecha_registro?: string;
}


export interface Categoria {
  id?: number;
  nombre: string;
  icono?: string;
  color?: string;
  estado: 'activo' | 'inactivo';
}

export interface Producto {
  id?: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  imagen?: string;
  emoji?: string;
  id_categoria: number;
  categoria_nombre?: string;
  disponible: number;
  popular: number;
  descuento: number;
}

export interface Pedido {
  id?: number;
  id_usuario: number;
  total: number;
  estado: 'pendiente' | 'preparando' | 'en_camino' | 'entregado';
  metodo_pago: string;
  direccion: string;
  fecha?: string;
  usuario_nombre?: string;
  usuario_telefono?: string;
  detalles?: DetallePedido[];
}

export interface DetallePedido {
  id?: number;
  id_pedido: number;
  id_producto: number;
  cantidad: number;
  precio: number;
  subtotal: number;
  producto_nombre?: string;
  emoji?: string;
}

export interface Carrito {
  id?: number;
  id_usuario: number;
  id_producto: number;
  cantidad: number;
  subtotal: number;
  usuario_nombre?: string;
  producto_nombre?: string;
  emoji?: string;
  precio?: number;
  disponible?: number;
}

export interface Banner {
  id?: number;
  titulo: string;
  descripcion?: string;
  imagen?: string;
  color?: string;
  activo: number;
}

export interface Cupon {
  id?: number;
  codigo: string;
  descuento: number;
  fecha_vencimiento: string;
  activo: number;
}

export interface Domicilio {
  id?: number;
  zona: string;
  precio: number;
  tiempo_estimado: string;
}

export interface Calificacion {
  id?: number;
  id_producto: number;
  id_usuario: number;
  comentario?: string;
  estrellas: number;
  usuario_nombre?: string;
  producto_nombre?: string;
  emoji?: string;
}

export interface Favorito {
  id?: number;
  id_usuario: number;
  id_producto: number;
  usuario_nombre?: string;
  producto_nombre?: string;
  emoji?: string;
  precio?: number;
  imagen?: string;
  disponible?: number;
}

export interface CarritoTotales {
  total_items: number;
  total_cantidad: number;
  total_precio: number;
}

export interface PedidoStats {
  total_pedidos: number;
  total_ventas: number;
  promedio_venta: number;
  pendientes: number;
  preparando: number;
  en_camino: number;
  entregados: number;
}

export interface CuponValidacion {
  valido: boolean;
  cupon?: Cupon;
  descuento?: number;
  nuevoTotal?: number;
  mensaje?: string;
}
