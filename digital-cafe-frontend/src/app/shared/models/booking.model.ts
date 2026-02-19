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
