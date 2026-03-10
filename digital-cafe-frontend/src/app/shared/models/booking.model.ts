export interface Booking {
  id: number;
  bookingNumber?: string;
  customerId: number;
  customerName?: string;
  customerEmail?: string;
  cafeId: number;
  cafeName?: string;
  tableId: number;
  tableNumber?: string;
  bookingDate: string;
  bookingTime: string;
  startTime?: string;
  endTime?: string;
  numberOfGuests: number;
  status: BookingStatus;
  specialRequests?: string;
  createdAt: string;
  canOrder?: boolean;
  hasOrder?: boolean;
}

export interface BookingRequest {
  cafeId: number;
  tableId: number;
  bookingDate: string;
  bookingTime: string;
  startTime?: string;
  endTime?: string;
  numberOfGuests: number;
  specialRequests?: string;
}

export enum BookingStatus {
  BOOKED = 'BOOKED',
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
}
