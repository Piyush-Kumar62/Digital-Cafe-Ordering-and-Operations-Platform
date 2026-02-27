import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { ApiService } from "@core/services/api.service";
import { AlertService } from "@core/services/alert.service";
import { Order } from "@shared/models/order.model";
import { Payment, PaymentMethod, PaymentRequest, PaymentStatus } from "@shared/models/payment.model";

@Component({
  selector: "app-payment",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: "./payment.component.html",
  styleUrls: ["./payment.component.scss"],
})
export class PaymentComponent implements OnInit {
  loading = true;
  processing = false;
  order: Order | null = null;
  payment: Payment | null = null;
  selectedMethod: PaymentMethod = PaymentMethod.UPI;
  readonly methods = [PaymentMethod.UPI, PaymentMethod.CARD, PaymentMethod.WALLET, PaymentMethod.CASH];
  readonly PaymentStatus = PaymentStatus;
  private orderId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private alertService: AlertService,
  ) {}

  ngOnInit(): void {
    const parsed = Number(this.route.snapshot.paramMap.get("orderId"));
    this.orderId = Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    if (!this.orderId) {
      this.alertService.error("Invalid order for payment.");
      this.router.navigate(["/customer/cart"]);
      return;
    }
    this.loadOrderAndPayment(this.orderId);
  }

  payNow(): void {
    if (!this.orderId || !this.order) {
      return;
    }
    if (this.payment?.status === PaymentStatus.COMPLETED) {
      this.goToTracking();
      return;
    }

    this.processing = true;
    this.alertService.loading("Processing your payment. Please wait.");
    const request: PaymentRequest = {
      orderId: this.orderId,
      amount: Number(this.order.totalAmount || 0),
      paymentMethod: this.selectedMethod,
    };

    this.apiService.createPayment(request).subscribe({
      next: (payment) => {
        this.payment = payment;
        const gatewayPaymentId = `SIM-PAY-${Date.now()}`;
        const signature = `SIM-SIG-${this.orderId}-${Date.now()}`;
        this.apiService.verifyPayment(payment.id, gatewayPaymentId, signature).subscribe({
          next: (verified) => {
            this.processing = false;
            this.alertService.close();
            this.payment = verified;
            this.alertService.success("Payment Successful", "Your payment has been completed.");
            this.goToTracking();
          },
          error: (err) => {
            this.processing = false;
            this.alertService.close();
            this.alertService.error("Payment Verification Failed", err?.error?.message || "Payment verification failed.");
          },
        });
      },
      error: (err) => {
        this.processing = false;
        this.alertService.close();
        this.alertService.error("Payment Failed", err?.error?.message || "Unable to initiate payment.");
      },
    });
  }

  goToTracking(): void {
    if (!this.orderId) {
      return;
    }
    this.router.navigate(["/customer/order-tracking", this.orderId]);
  }

  private loadOrderAndPayment(orderId: number): void {
    this.loading = true;
    this.apiService.getOrderById(orderId).subscribe({
      next: (order) => {
        this.order = order;
        this.apiService.getPaymentByOrder(orderId).subscribe({
          next: (payment) => {
            this.payment = payment;
            this.loading = false;
          },
          error: () => {
            this.payment = null;
            this.loading = false;
          },
        });
      },
      error: () => {
        this.loading = false;
        this.alertService.error("Unable to load order for payment.");
        this.router.navigate(["/customer/cart"]);
      },
    });
  }
}


