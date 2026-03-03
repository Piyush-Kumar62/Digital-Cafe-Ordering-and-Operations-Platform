export interface Order {
  id: number;
  orderNumber: string;
  bookingId?: number;
  bookingNumber?: string;
  customerId: number;
  customerName?: string;
  cafeId: number;
  cafeName?: string;
  tableId?: number;
  tableNumber?: string;
  items: OrderItem[];
  subtotal?: number;
  tax?: number;
  discount?: number;
  totalAmount: number;
  status: OrderStatus;
  orderType?: OrderType;
  specialInstructions?: string;
  placedAt?: string;
  preparingAt?: string;
  readyAt?: string;
  servedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  payment?: {
    paymentId?: number;
    status?: string;
    transactionId?: string;
    completedAt?: string;
  };
}

export interface OrderItem {
  id: number;
  menuItemId: number;
  menuItemName: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  price?: number;
  subtotal?: number;
  specialInstructions?: string;
}

export interface OrderRequest {
  bookingId: number;
  items: OrderItemRequest[];
  specialInstructions?: string;
}

export interface OrderItemRequest {
  menuItemId: number;
  quantity: number;
  specialInstructions?: string;
}

export enum OrderStatus {
  PENDING_PAYMENT = "PENDING_PAYMENT", // Awaiting payment — NOT in kitchen
  PLACED = "PLACED", // Paid — visible to chef
  PREPARING = "PREPARING",
  READY = "READY",
  SERVED = "SERVED",
  CANCELLED = "CANCELLED",
}

export enum OrderType {
  DINE_IN = "DINE_IN",
  TAKEAWAY = "TAKEAWAY",
}
