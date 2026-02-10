export interface Order {
  id: number;
  orderNumber: string;
  customerId: number;
  customerName?: string;
  cafeId: number;
  cafeName?: string;
  tableId: number;
  tableNumber?: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  orderType: OrderType;
  specialInstructions?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: number;
  menuItemId: number;
  menuItemName: string;
  quantity: number;
  price: number;
  subtotal: number;
  specialInstructions?: string;
}

export interface OrderRequest {
  cafeId: number;
  tableId: number;
  items: OrderItemRequest[];
  orderType: OrderType;
  specialInstructions?: string;
}

export interface OrderItemRequest {
  menuItemId: number;
  quantity: number;
  specialInstructions?: string;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  SERVED = 'SERVED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum OrderType {
  DINE_IN = 'DINE_IN',
  TAKEAWAY = 'TAKEAWAY',
}

export interface Booking {
  id: number;
  customerId: number;
  customerName?: string;
  cafeId: number;
  cafeName?: string;
  tableId: number;
  tableNumber?: string;
  bookingDate: string;
  bookingTime: string;
  numberOfGuests: number;
  status: BookingStatus;
  specialRequests?: string;
  createdAt: string;
}

export interface BookingRequest {
  cafeId: number;
  tableId: number;
  bookingDate: string;
  bookingTime: string;
  numberOfGuests: number;
  specialRequests?: string;
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
}
