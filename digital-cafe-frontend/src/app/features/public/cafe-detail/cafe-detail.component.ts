import { AsyncPipe, CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthService } from "@core/auth/auth.service";
import { ApiService } from "@core/services/api.service";
import { AlertService } from "@core/services/alert.service";
import { CartService } from "@features/customer/cart/cart.service";
import { MenuItem } from "@shared/models/menu.model";
import {
  Payment,
  PaymentMethod,
  PaymentStatus,
} from "@shared/models/payment.model";
import { map, Observable, take } from "rxjs";
import { CafeBrowseService } from "../cafe-browse.service";
import {
  PublicCafeDetail,
  PublicCafeMenuItem,
} from "@shared/models/cafe.model";
import { environment } from "@environments/environment";

declare const Razorpay: any;

type RazorpayLoadFailureReason =
  | "blocked"
  | "timeout"
  | "load-error"
  | "unknown";

@Component({
  selector: "app-cafe-detail",
  standalone: true,
  imports: [CommonModule, FormsModule, AsyncPipe],
  templateUrl: "./cafe-detail.component.html",
  styleUrl: "./cafe-detail.component.scss",
})
export class CafeDetailComponent implements OnInit {
  cafe: PublicCafeDetail | null = null;
  loading = true;
  bookingInProgress = false;
  orderInProgress = false;
  paymentInProgress = false;
  placeAndPayInProgress = false;
  availableTables = 0;
  availableTablesList: Array<{
    id: number;
    tableNumber: string;
    capacity: number;
  }> = [];
  selectedTableId: number | null = null;
  tablesLoading = false;
  bookingId: number | null = null;
  orderId: number | null = null;
  orderAmount = 0;
  selectedDate = "";
  selectedTime = "";
  guests = 2;
  paymentMethod: PaymentMethod = PaymentMethod.UPI;
  quantityMap: Record<number, number> = {};
  cartItems$: Observable<Array<{ item: MenuItem; quantity: number }>>;
  cartTotal$: Observable<number>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cafeBrowseService: CafeBrowseService,
    private apiService: ApiService,
    private cartService: CartService,
    private authService: AuthService,
    private alertService: AlertService,
  ) {
    this.cartItems$ = this.cartService.cart$.pipe(map((cart) => cart.items));
    this.cartTotal$ = this.cartService.cart$.pipe(
      map((cart) => cart.totalPrice),
    );
  }

  ngOnInit(): void {
    this.bootstrapDateTimeDefaults();
    const cafeId = Number(this.route.snapshot.paramMap.get("id"));
    if (!Number.isFinite(cafeId) || cafeId <= 0) {
      this.router.navigate(["/cafes"]);
      return;
    }

    this.cafeBrowseService.getCafeDetails(cafeId).subscribe({
      next: (res) => {
        this.cafe = res;
        this.cartService.ensureCafeScope(res.cafeDetails.id);
        this.loading = false;
        this.loadAvailability();
      },
      error: () => {
        this.loading = false;
        this.router.navigate(["/cafes"]);
      },
    });
  }

  setQuantity(menuId: number, value: string): void {
    const numeric = Number(value);
    this.quantityMap[menuId] =
      Number.isFinite(numeric) && numeric > 0 ? Math.min(numeric, 10) : 1;
  }

  getQuantity(menuId: number): number {
    return this.quantityMap[menuId] || 1;
  }

  incrementQuantity(menuId: number): void {
    this.quantityMap[menuId] = Math.min(this.getQuantity(menuId) + 1, 10);
  }

  decrementQuantity(menuId: number): void {
    this.quantityMap[menuId] = Math.max(this.getQuantity(menuId) - 1, 1);
  }

  addToCart(item: PublicCafeMenuItem): void {
    if (!item.available || !this.cafe) {
      return;
    }
    const qty = this.getQuantity(item.id);
    const mapped: MenuItem = {
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.category,
      price: item.price,
      imageUrl: item.imageUrl,
      isAvailable: item.available,
      cafeId: this.cafe.cafeDetails.id,
      cafeName: this.cafe.cafeDetails.name,
    };
    for (let i = 0; i < qty; i += 1) {
      this.cartService.addItem(mapped);
    }
    this.alertService.success(`${item.name} added to cart`);
  }

  onSlotChange(): void {
    this.selectedTableId = null;
    this.loadAvailability();
  }

  selectTable(tableId: number): void {
    if (this.bookingId) return; // already booked
    this.selectedTableId = this.selectedTableId === tableId ? null : tableId;
  }

  bookTable(): void {
    if (!this.cafe) return;
    if (this.bookingId) {
      this.alertService.info("Table already booked for this session.");
      return;
    }
    if (!this.authService.isAuthenticated || !this.authService.isCustomer()) {
      this.router.navigate(["/auth/login"], {
        queryParams: { returnUrl: this.router.url },
      });
      return;
    }
    const timeSlot = this.selectedTime
      ? this.selectedTime.split(":").slice(0, 2).join(":")
      : "";
    if (!this.selectedDate || !timeSlot) {
      this.alertService.error("Select date and time before booking.");
      return;
    }
    if (!this.selectedTableId) {
      this.alertService.error("Please select a table first.");
      return;
    }

    this.bookingInProgress = true;
    this.cafeBrowseService
      .createBooking({
        cafeId: this.cafe.cafeDetails.id,
        tableId: this.selectedTableId,
        date: this.selectedDate,
        timeSlot,
        numberOfGuests: this.guests,
      })
      .subscribe({
        next: (booking) => {
          this.bookingId = booking.id;
          this.bookingInProgress = false;
          this.alertService.success(
            "Table booked successfully! You can now browse the menu.",
          );
        },
        error: (err) => {
          this.bookingInProgress = false;
          this.alertService.error(
            err?.error?.message || "Unable to book table.",
          );
        },
      });
  }

  /**
   * Unified flow: creates the order (PENDING_PAYMENT) and immediately
   * initiates payment in a single click — no two-step UI.
   */
  placeOrderAndPay(): void {
    if (this.placeAndPayInProgress || this.paymentInProgress) {
      return; // prevent double-click
    }
    if (!this.bookingId) {
      this.alertService.error("Book a table first.");
      return;
    }
    if (!this.authService.isAuthenticated || !this.authService.isCustomer()) {
      this.router.navigate(["/auth/login"], {
        queryParams: { returnUrl: this.router.url },
      });
      return;
    }

    this.placeAndPayInProgress = true;

    this.cartItems$
      .pipe(
        take(1),
        map((items) => items.filter((l) => l.quantity > 0)),
      )
      .subscribe({
        next: (lines) => {
          if (lines.length === 0) {
            this.placeAndPayInProgress = false;
            this.alertService.error("Cart is empty.");
            return;
          }

          // ── Fast-retry path ────────────────────────────────────────────────
          // If an orderId is already held from a prior cancelled/failed payment
          // attempt, skip createOrder (backend would reuse it anyway) and go
          // straight to payment — avoids an unnecessary round-trip.
          if (this.orderId) {
            this.cafeBrowseService
              .pay({
                orderId: this.orderId,
                amount: this.orderAmount || 1,
                paymentMethod: this.paymentMethod,
              })
              .subscribe({
                next: (payment) => {
                  this.placeAndPayInProgress = false;
                  this.paymentInProgress = true;
                  this.handlePaymentFlow(payment);
                },
                error: (err) => {
                  // Payment init failed — clear stale orderId so next click creates fresh order
                  this.orderId = null;
                  this.placeAndPayInProgress = false;
                  this.alertService.error(
                    err?.error?.message || "Payment initiation failed.",
                  );
                },
              });
            return;
          }

          // ── Normal path: create order then pay ─────────────────────────────
          this.cafeBrowseService
            .createOrder({
              bookingId: this.bookingId as number,
              items: lines.map((line) => ({
                menuItemId: line.item.id,
                quantity: line.quantity,
              })),
            })
            .subscribe({
              next: (order) => {
                this.orderId = order.id;
                this.orderAmount = Number(
                  order.totalAmount ||
                    lines.reduce(
                      (s, l) => s + Number(l.item.price || 0) * l.quantity,
                      0,
                    ),
                );

                // Immediately initiate payment after order creation
                this.cafeBrowseService
                  .pay({
                    orderId: this.orderId as number,
                    amount: this.orderAmount || 1,
                    paymentMethod: this.paymentMethod,
                  })
                  .subscribe({
                    next: (payment) => {
                      this.placeAndPayInProgress = false;
                      this.paymentInProgress = true;
                      this.handlePaymentFlow(payment);
                    },
                    error: (err) => {
                      this.placeAndPayInProgress = false;
                      this.alertService.error(
                        err?.error?.message || "Payment initiation failed.",
                      );
                    },
                  });
              },
              error: (err) => {
                this.placeAndPayInProgress = false;
                this.alertService.error(
                  err?.error?.message || "Unable to place order.",
                );
              },
            });
        },
        error: () => {
          this.placeAndPayInProgress = false;
        },
      });
  }

  placeOrder(): void {
    if (!this.bookingId) {
      this.alertService.error("Book a table first.");
      return;
    }
    this.orderInProgress = true;
    this.cartItems$
      .pipe(
        take(1),
        map((items) => items.filter((line) => line.quantity > 0)),
      )
      .subscribe({
        next: (lines) => {
          if (lines.length === 0) {
            this.orderInProgress = false;
            this.alertService.error("Cart is empty.");
            return;
          }
          this.cafeBrowseService
            .createOrder({
              bookingId: this.bookingId as number,
              items: lines.map((line) => ({
                menuItemId: line.item.id,
                quantity: line.quantity,
              })),
            })
            .subscribe({
              next: (order) => {
                this.orderInProgress = false;
                this.orderId = order.id;
                this.orderAmount = Number(
                  order.totalAmount ||
                    lines.reduce(
                      (sum, line) =>
                        sum + Number(line.item.price || 0) * line.quantity,
                      0,
                    ),
                );
                this.alertService.success("Order placed successfully.");
              },
              error: (err) => {
                this.orderInProgress = false;
                this.alertService.error(
                  err?.error?.message || "Unable to place order.",
                );
              },
            });
        },
        error: () => {
          this.orderInProgress = false;
        },
      });
  }

  payNow(): void {
    if (!this.orderId) {
      this.alertService.error("Place order before payment.");
      return;
    }
    this.paymentInProgress = true;
    this.cafeBrowseService
      .pay({
        orderId: this.orderId,
        amount: this.orderAmount || 1,
        paymentMethod: this.paymentMethod,
      })
      .subscribe({
        next: (payment) => {
          this.handlePaymentFlow(payment);
        },
        error: (err) => {
          this.paymentInProgress = false;
          this.alertService.error(err?.error?.message || "Payment failed.");
        },
      });
  }

  removeFromCart(menuId: number): void {
    this.cartService.removeItem(menuId);
  }

  addOneToCart(item: MenuItem): void {
    this.cartService.addItem(item);
  }

  private loadAvailability(): void {
    if (!this.cafe) return;
    const timeSlot = this.selectedTime
      ? this.selectedTime.split(":").slice(0, 2).join(":")
      : "";
    if (!this.selectedDate || !timeSlot) return;
    this.tablesLoading = true;
    this.cafeBrowseService
      .getTableAvailability(
        this.cafe.cafeDetails.id,
        this.selectedDate,
        timeSlot,
        this.guests,
      )
      .subscribe({
        next: (tables) => {
          this.availableTablesList = tables || [];
          this.availableTables = this.availableTablesList.length;
          this.tablesLoading = false;
        },
        error: () => {
          this.availableTablesList = [];
          this.availableTables = 0;
          this.tablesLoading = false;
        },
      });
  }

  private bootstrapDateTimeDefaults(): void {
    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const time = new Date(now.getTime() + 60 * 60 * 1000);
    const hh = String(time.getHours()).padStart(2, "0");
    const mm = String(Math.floor(time.getMinutes() / 30) * 30).padStart(2, "0");
    this.selectedDate = date;
    this.selectedTime = `${hh}:${mm}`;
  }

  fmt12h(val: string | null | undefined): string {
    if (!val || !val.includes(":")) return "";
    const [hStr, mStr] = val.split(":");
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (isNaN(h) || isNaN(m)) return "";
    const ampm = h >= 12 ? "PM" : "AM";
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
  }

  getCategoryClass(category: string | null | undefined): string {
    const normalized = (category || "").trim().toUpperCase();
    if (!normalized) {
      return "category-default";
    }

    if (normalized.includes("COFFEE") || normalized.includes("ESPRESSO")) {
      return "category-coffee";
    }
    if (normalized.includes("TEA")) {
      return "category-tea";
    }
    if (normalized.includes("BREAKFAST")) {
      return "category-breakfast";
    }
    if (
      normalized.includes("DESSERT") ||
      normalized.includes("BAKERY") ||
      normalized.includes("PASTRY")
    ) {
      return "category-dessert";
    }
    if (
      normalized.includes("SNACK") ||
      normalized.includes("FAST") ||
      normalized.includes("STARTER")
    ) {
      return "category-snacks";
    }
    if (
      normalized.includes("LUNCH") ||
      normalized.includes("DINNER") ||
      normalized.includes("MAIN")
    ) {
      return "category-main-course";
    }
    if (
      normalized.includes("BEVERAGE") ||
      normalized.includes("DRINK") ||
      normalized.includes("JUICE")
    ) {
      return "category-beverage";
    }

    return "category-default";
  }

  private handlePaymentFlow(payment: Payment): void {
    const gateway = (payment.paymentGateway || "").toUpperCase();

    if (gateway === "RAZORPAY") {
      this.openRazorpayCheckout(payment);
      return;
    }

    // TEST gateway in backend may already auto-complete.
    if (payment.status === PaymentStatus.COMPLETED) {
      this.completePaymentSuccess();
      return;
    }

    if (gateway === "TEST") {
      this.runSimulatedPayment(payment);
      return;
    }

    this.paymentInProgress = false;
    this.alertService.error(
      "Payment gateway is not configured for Razorpay. Please contact support.",
    );
  }

  private openRazorpayCheckout(payment: Payment): void {
    if (!payment.paymentGatewayOrderId?.startsWith("order_")) {
      this.paymentInProgress = false;
      this.alertService.error("Invalid Razorpay order. Please retry.");
      return;
    }
    if (!environment.razorpayKeyId) {
      this.paymentInProgress = false;
      this.alertService.error(
        "Razorpay key is missing in frontend config. Use TEST mode or configure key.",
      );
      return;
    }

    const selectedMethod = String(this.paymentMethod || "").toUpperCase();
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
      amount: Math.round(Number(payment.amount || this.orderAmount || 0) * 100),
      currency: payment.currency || "INR",
      name: "Digital Cafe",
      description: `Order #${this.orderId}`,
      order_id: payment.paymentGatewayOrderId,
      prefill: this.getRazorpayPrefill(),
      handler: (response: any) => {
        this.verifyPayment(
          payment.id,
          response?.razorpay_payment_id,
          response?.razorpay_signature,
        );
      },
      theme: { color: "#16a34a" },
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
      modal: {
        ondismiss: () => {
          this.paymentInProgress = false;
          this.alertService.error("Payment cancelled by user.");
          this.apiService
            .markPaymentFailed(payment.id, "User cancelled Razorpay checkout")
            .subscribe();
        },
      },
    };

    this.ensureRazorpayLoaded()
      .then(() => {
        const rzp = new Razorpay(options);
        rzp.open();
      })
      .catch((reason: RazorpayLoadFailureReason) => {
        this.paymentInProgress = false;
        if (reason === "blocked") {
          this.alertService.error(
            "Checkout blocked by browser",
            "Please allow checkout.razorpay.com in your ad blocker/privacy extension and retry.",
          );
          return;
        }

        if (reason === "timeout") {
          this.alertService.error(
            "Checkout timeout",
            "Payment gateway took too long to load. Please check your network and try again.",
          );
          return;
        }

        this.alertService.error("Unable to load Razorpay checkout.");
      });
  }

  private ensureRazorpayLoaded(): Promise<void> {
    if (typeof Razorpay !== "undefined") {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        reject("timeout");
      }, 12000);

      const existing = document.getElementById(
        "razorpay-checkout-js",
      ) as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener(
          "load",
          () => {
            window.clearTimeout(timeoutId);
            resolve();
          },
          { once: true },
        );
        existing.addEventListener(
          "error",
          () => {
            window.clearTimeout(timeoutId);
            reject("load-error");
          },
          { once: true },
        );
        return;
      }
      const script = document.createElement("script");
      script.id = "razorpay-checkout-js";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => {
        window.clearTimeout(timeoutId);
        resolve();
      };
      script.onerror = () => {
        window.clearTimeout(timeoutId);
        reject("blocked");
      };
      document.body.appendChild(script);
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
    this.apiService
      .verifyPayment(paymentId, gatewayPaymentId, signature)
      .subscribe({
        next: () => this.completePaymentSuccess(),
        error: (err) => {
          this.paymentInProgress = false;
          this.alertService.error(
            err?.error?.message || "Payment verification failed.",
          );
        },
      });
  }

  private completePaymentSuccess(): void {
    this.paymentInProgress = false;
    this.cartService.clearCart();
    this.alertService
      .successWithButton(
        "Payment Successful! 🎉",
        "Your order has been placed and sent to the kitchen.",
        "Track My Order 🍽️",
      )
      .then(() => {
        this.router.navigate(["/customer/order-tracking", this.orderId]);
      });
  }
}
