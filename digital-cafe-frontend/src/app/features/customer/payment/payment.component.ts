import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { ApiService } from "@core/services/api.service";
import { AlertService } from "@core/services/alert.service";
import { Order } from "@shared/models/order.model";
import {
  Payment,
  PaymentMethod,
  PaymentRequest,
  PaymentStatus,
} from "@shared/models/payment.model";
import { environment } from "@environments/environment";

// Declare Razorpay as a global so TypeScript doesn't complain
declare const Razorpay: any;

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
  readonly methods = [
    PaymentMethod.UPI,
    PaymentMethod.CARD,
    PaymentMethod.WALLET,
  ];
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
    if (!this.orderId || !this.order) return;

    if (this.payment?.status === PaymentStatus.COMPLETED) {
      this.goToTracking();
      return;
    }

    this.processing = true;
    this.alertService.loading("Initiating payment. Please wait…");

    const request: PaymentRequest = {
      orderId: this.orderId,
      amount: Number(this.order.totalAmount || 0),
      paymentMethod: this.selectedMethod,
    };

    this.apiService.createPayment(request).subscribe({
      next: (payment) => {
        this.payment = payment;
        this.alertService.close();

        // Decide flow: real Razorpay vs TEST simulation
        if (
          payment.paymentGatewayOrderId?.startsWith("order_") &&
          environment.razorpayKeyId
        ) {
          this.openRazorpayCheckout(payment);
        } else {
          this.runSimulatedPayment(payment);
        }
      },
      error: (err) => {
        this.processing = false;
        this.alertService.close();
        this.alertService.error(
          "Payment Failed",
          err?.error?.message || "Unable to initiate payment.",
        );
      },
    });
  }

  /** Opens the Razorpay checkout popup with real keys */
  private openRazorpayCheckout(payment: Payment): void {
    const options = {
      key: environment.razorpayKeyId,
      amount: Math.round(Number(payment.amount) * 100), // paise
      currency: payment.currency || "INR",
      name: "Digital Café",
      description: `Order #${this.order?.orderNumber || this.orderId}`,
      order_id: payment.paymentGatewayOrderId,
      handler: (response: any) => {
        // Razorpay calls this on success
        this.verifyPayment(
          payment.id,
          response.razorpay_payment_id,
          response.razorpay_signature,
        );
      },
      prefill: {},
      theme: { color: "#4F46E5" },
      modal: {
        ondismiss: () => {
          this.processing = false;
          this.alertService.error(
            "Payment Cancelled",
            "You cancelled the payment. Your order is still saved.",
          );
          // Mark payment failed on backend
          this.apiService
            .markPaymentFailed(payment.id, "User closed Razorpay checkout")
            .subscribe();
        },
      },
    };

    try {
      const rzp = new Razorpay(options);
      rzp.open();
    } catch (e) {
      this.processing = false;
      this.alertService.error(
        "Checkout Error",
        "Could not open payment window. Please try again.",
      );
    }
  }

  /** Simulates payment verification for TEST gateway mode */
  private runSimulatedPayment(payment: Payment): void {
    const gatewayPaymentId = `SIM-PAY-${Date.now()}`;
    const signature = `SIM-SIG-${this.orderId}-${Date.now()}`;
    this.verifyPayment(payment.id, gatewayPaymentId, signature);
  }

  private verifyPayment(
    paymentId: number,
    gatewayPaymentId: string,
    signature: string,
  ): void {
    this.alertService.loading("Verifying payment…");
    this.apiService
      .verifyPayment(paymentId, gatewayPaymentId, signature)
      .subscribe({
        next: (verified) => {
          this.processing = false;
          this.alertService.close();
          this.payment = verified;
          this.alertService.success(
            "Payment Successful! 🎉",
            "Your order has been confirmed and sent to the kitchen.",
          );
          this.goToTracking();
        },
        error: (err) => {
          this.processing = false;
          this.alertService.close();
          this.alertService.error(
            "Verification Failed",
            err?.error?.message ||
              "Payment verification failed. Contact support.",
          );
        },
      });
  }

  goToTracking(): void {
    if (!this.orderId) return;
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
            // If payment is already complete, skip to tracking
            if (payment.status === PaymentStatus.COMPLETED) {
              this.goToTracking();
            }
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
