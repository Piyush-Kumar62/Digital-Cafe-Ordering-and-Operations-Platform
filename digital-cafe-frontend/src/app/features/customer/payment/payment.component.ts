import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { AuthService } from "@core/auth/auth.service";
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
    PaymentMethod.NET_BANKING,
    PaymentMethod.WALLET,
  ];
  readonly PaymentStatus = PaymentStatus;
  private orderId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
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

        const gateway = (payment.paymentGateway || "").toUpperCase();

        // TEST mode may be auto-completed in backend.
        if (payment.status === PaymentStatus.COMPLETED) {
          this.processing = false;
          this.alertService
            .successWithButton(
              "Payment Successful! 🎉",
              "Your order has been confirmed and sent to the kitchen.",
              "Track My Order 🍽️",
            )
            .then(() => this.goToTracking());
          return;
        }

        if (gateway === "RAZORPAY") {
          if (!environment.razorpayKeyId) {
            this.processing = false;
            this.alertService.error(
              "Razorpay key missing in frontend config.",
              "Add razorpayKeyId in environment and retry.",
            );
            return;
          }
          this.openRazorpayCheckout(payment);
          return;
        }

        if (gateway === "TEST") {
          this.runSimulatedPayment(payment);
          return;
        }

        this.processing = false;
        this.alertService.error(
          "Payment Gateway Error",
          "Backend payment gateway is not configured as Razorpay.",
        );
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
    if (!payment.paymentGatewayOrderId?.startsWith("order_")) {
      this.processing = false;
      this.alertService.error(
        "Payment Error",
        "Invalid Razorpay order reference. Please try again.",
      );
      return;
    }
    const selectedMethod = String(this.selectedMethod || "").toUpperCase();
    const methodConfig =
      selectedMethod === "UPI"
        ? {
            upi: true,
            card: false,
            netbanking: false,
            wallet: false,
            emi: false,
            paylater: false,
          }
        : selectedMethod === "CARD"
          ? {
              upi: true,
              card: true,
              netbanking: true,
              wallet: true,
              emi: true,
              paylater: true,
            }
          : selectedMethod === "NET_BANKING"
            ? {
                upi: false,
                card: false,
                netbanking: true,
                wallet: false,
                emi: false,
                paylater: false,
              }
            : selectedMethod === "WALLET"
              ? {
                  upi: false,
                  card: false,
                  netbanking: false,
                  wallet: true,
                  emi: false,
                  paylater: false,
                }
              : undefined;

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
      prefill: this.getRazorpayPrefill(),
      method: methodConfig,
      config:
        selectedMethod === "UPI"
          ? {
              display: {
                blocks: {
                  upi: {
                    name: "Pay using UPI",
                    instruments: [{ method: "upi" }],
                  },
                },
                sequence: ["block.upi"],
                preferences: { show_default_blocks: false },
              },
            }
          : undefined,
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

    this.ensureRazorpayLoaded()
      .then(() => {
        const rzp = new Razorpay(options);
        rzp.open();
      })
      .catch(() => {
        this.processing = false;
        this.alertService.error(
          "Checkout Error",
          "Could not open payment window. Please try again.",
        );
      });
  }

  private getRazorpayPrefill(): { name?: string; email?: string } {
    const user = this.authService.currentUserValue;
    if (!user) {
      return {};
    }
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
    return {
      name: fullName || user.username || "Digital Cafe Customer",
      email: user.email || undefined,
    };
  }

  private ensureRazorpayLoaded(): Promise<void> {
    if (typeof Razorpay !== "undefined") {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const existing = document.getElementById(
        "razorpay-checkout-js",
      ) as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(), { once: true });
        return;
      }
      const script = document.createElement("script");
      script.id = "razorpay-checkout-js";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject();
      document.body.appendChild(script);
    });
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
          this.alertService
            .successWithButton(
              "Payment Successful! 🎉",
              "Your order has been confirmed and sent to the kitchen.",
              "Track My Order 🍽️",
            )
            .then(() => this.goToTracking());
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
