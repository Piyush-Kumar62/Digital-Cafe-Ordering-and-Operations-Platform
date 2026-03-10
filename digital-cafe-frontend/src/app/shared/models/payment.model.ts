export interface Payment {
  id: number;
  orderId: number;
  orderNumber?: string;
  transactionId?: string;
  paymentGatewayOrderId?: string;
  paymentGatewayPaymentId?: string;
  amount: number;
  currency?: string;
  status: PaymentStatus;
  paymentMethod?: PaymentMethod | string;
  paymentGateway?: string;
  initiatedAt?: string;
  completedAt?: string;
  failureReason?: string;
}

export interface PaymentRequest {
  orderId: number;
  amount: number;
  paymentMethod: PaymentMethod | string;
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  NET_BANKING = 'NET_BANKING',
  UPI = 'UPI',
  WALLET = 'WALLET',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}
