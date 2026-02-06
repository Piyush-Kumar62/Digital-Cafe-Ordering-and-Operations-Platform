import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PaymentRequest {
  orderId: number;
  amount: number;
  paymentMethod: string;
}

export interface PaymentResponse {
  paymentId: number;
  orderId: number;
  amount: number;
  currency: string;
  transactionId: string;
  razorpayKeyId?: string;
  status: string;
}

export interface Payment {
  id: number;
  orderId: number;
  bookingId?: number;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  transactionId: string;
  paymentDate?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private apiUrl = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) {}

  createPaymentOrder(request: PaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.apiUrl}/create-order`, request);
  }

  verifyPayment(transactionId: string, signature: string): Observable<Payment> {
    return this.http.post<Payment>(`${this.apiUrl}/verify`, null, {
      params: { transactionId, signature },
    });
  }

  processRefund(paymentId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/${paymentId}/refund`, {});
  }

  getPaymentById(paymentId: number): Observable<Payment> {
    return this.http.get<Payment>(`${this.apiUrl}/${paymentId}`);
  }

  getPaymentByTransactionId(transactionId: string): Observable<Payment> {
    return this.http.get<Payment>(`${this.apiUrl}/transaction/${transactionId}`);
  }

  getPaymentByOrderId(orderId: number): Observable<Payment> {
    return this.http.get<Payment>(`${this.apiUrl}/order/${orderId}`);
  }
}
