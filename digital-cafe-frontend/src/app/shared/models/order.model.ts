export interface Order {
  id?: number;
  customerId: number;
  cafeId: number;
  orderType: 'DINE_IN' | 'TAKEAWAY';
  status: 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  totalAmount: number;
  tableId?: number;
  specialInstructions?: string;
  items: OrderItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  id?: number;
  orderId?: number;
  menuItemId: number;
  menuItemName?: string;
  quantity: number;
  price: number;
  subtotal?: number;
  specialInstructions?: string;
}

export interface CartItem {
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  specialInstructions?: string;
}

export interface Booking {
  id?: number;
  customerId: number;
  cafeId: number;
  tableId: number;
  bookingDate: string;
  bookingTime: string;
  numberOfGuests: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  specialRequests?: string;
  createdAt?: string;
}

export interface Payment {
  id?: number;
  orderId: number;
  amount: number;
  paymentMethod: 'CARD' | 'UPI' | 'NET_BANKING' | 'WALLET';
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  transactionId?: string;
  paymentDate?: string;
}
