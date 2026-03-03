import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { Subject, Subscription, interval, takeUntil } from "rxjs";
import { AlertService } from "@core/services/alert.service";
import { WebSocketService } from "@core/websocket/websocket.service";
import { Booking, BookingRequest } from "@shared/models/booking.model";
import { Cafe, Table } from "@shared/models/cafe.model";
import { MenuItem } from "@shared/models/menu.model";
import { Order, OrderStatus, OrderRequest } from "@shared/models/order.model";
import { CustomerJourneyService } from "../customer-journey.service";
import { MenuService } from "./menu.service";
import { CafeBrowseService } from "@features/public/cafe-browse.service";

type CartLine = { item: MenuItem; quantity: number };

@Component({
  selector: "app-menu",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./menu.component.html",
  styleUrls: ["./menu.component.scss"],
})
export class MenuComponent implements OnInit, OnDestroy {
  cafes: Cafe[] = [];
  menuItems: MenuItem[] = [];
  availableTables: Table[] = [];
  cart: CartLine[] = [];
  loadingCafes = false;

  selectedCafeId: number | null = null;
  selectedDate = "";
  selectedTime = "";
  selectedTableId: number | null = null;
  guestsCount = 2;
  searchText = "";
  selectedCategory = "ALL";
  categories: string[] = ["ALL"];

  activeBooking: Booking | null = null;
  activeOrder: Order | null = null;
  loadingMenu = false;
  loadingTables = false;
  bookingInProgress = false;
  orderInProgress = false;

  private quantitySelection: Record<number, number> = {};
  private orderTopicSub?: Subscription;
  private destroy$ = new Subject<void>();

  readonly orderSteps: OrderStatus[] = [
    OrderStatus.PENDING_PAYMENT,
    OrderStatus.PLACED,
    OrderStatus.PREPARING,
    OrderStatus.READY,
    OrderStatus.SERVED,
  ];

  constructor(
    private menuService: MenuService,
    private cafeBrowseService: CafeBrowseService,
    private journeyService: CustomerJourneyService,
    private webSocketService: WebSocketService,
    private alertService: AlertService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.activeBooking = this.journeyService.getActiveBooking();
    this.selectedCafeId = this.journeyService.getSelectedCafeId();
    this.bootstrapDateTimeDefaults();
    this.loadCafes();
    this.startBookingAvailabilityAutoRefresh();
  }

  ngOnDestroy(): void {
    if (this.orderTopicSub && this.activeOrder?.id) {
      this.webSocketService.unsubscribe(
        `/topic/customer-order/${this.activeOrder.id}`,
      );
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  get filteredMenuItems(): MenuItem[] {
    const query = this.searchText.trim().toLowerCase();
    return this.menuItems.filter((item) => {
      const categoryMatch =
        this.selectedCategory === "ALL" ||
        (item.category || "").toUpperCase() === this.selectedCategory;
      const textMatch =
        !query ||
        (item.name || "").toLowerCase().includes(query) ||
        (item.description || "").toLowerCase().includes(query);
      return categoryMatch && textMatch;
    });
  }

  get bookingReady(): boolean {
    return !!this.activeBooking?.id;
  }

  get cartTotal(): number {
    return this.cart.reduce(
      (sum, line) => sum + line.item.price * line.quantity,
      0,
    );
  }

  get cartItemsCount(): number {
    return this.cart.reduce((sum, line) => sum + line.quantity, 0);
  }

  get selectedCafe(): Cafe | null {
    if (!this.selectedCafeId) {
      return null;
    }
    return this.cafes.find((cafe) => cafe.id === this.selectedCafeId) || null;
  }

  getMenuImage(item: MenuItem): string {
    return this.cafeBrowseService.resolveImageUrl(item.imageUrl) || "";
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (!img) return;
    img.onerror = null;
    img.style.display = "none";
  }

  onCafeChange(cafeIdValue: string | number): void {
    const cafeId = Number(cafeIdValue);
    if (!Number.isFinite(cafeId) || cafeId <= 0) {
      this.selectedCafeId = null;
      this.menuItems = [];
      this.availableTables = [];
      return;
    }

    this.selectedCafeId = cafeId;
    this.selectedTableId = null;
    this.activeBooking = null;
    this.activeOrder = null;
    this.cart = [];
    this.journeyService.setSelectedCafeId(cafeId);
    this.journeyService.setActiveBooking(null);
    this.webSocketService.subscribeToTableAvailability(cafeId);
    this.loadMenuItems();
    this.loadAvailableTables();
  }

  selectCafeCard(cafeId: number): void {
    this.onCafeChange(cafeId);
  }

  setCategory(category: string): void {
    this.selectedCategory = category;
  }

  getSelectedQuantity(itemId: number): number {
    return this.quantitySelection[itemId] ?? 1;
  }

  setSelectedQuantity(itemId: number, value: string): void {
    const qty = Number(value);
    this.quantitySelection[itemId] =
      Number.isFinite(qty) && qty > 0 ? Math.min(qty, 10) : 1;
  }

  increaseSelectedQuantity(itemId: number): void {
    this.quantitySelection[itemId] = Math.min(
      this.getSelectedQuantity(itemId) + 1,
      10,
    );
  }

  decreaseSelectedQuantity(itemId: number): void {
    this.quantitySelection[itemId] = Math.max(
      this.getSelectedQuantity(itemId) - 1,
      1,
    );
  }

  addToCart(item: MenuItem): void {
    if (!item.isAvailable) {
      return;
    }

    const qty = this.getSelectedQuantity(item.id);
    const existing = this.cart.find((line) => line.item.id === item.id);
    if (existing) {
      existing.quantity += qty;
    } else {
      this.cart.push({ item, quantity: qty });
    }
    this.alertService.success(`${item.name} added to cart`);
  }

  increaseCartItem(itemId: number): void {
    const line = this.cart.find((c) => c.item.id === itemId);
    if (line) line.quantity += 1;
  }

  decreaseCartItem(itemId: number): void {
    const line = this.cart.find((c) => c.item.id === itemId);
    if (!line) return;
    if (line.quantity <= 1) {
      this.cart = this.cart.filter((c) => c.item.id !== itemId);
      return;
    }
    line.quantity -= 1;
  }

  bookTable(): void {
    if (
      !this.selectedCafeId ||
      !this.selectedDate ||
      !this.selectedTime ||
      !this.selectedTableId
    ) {
      this.alertService.error("Please select date, time, and table to book.");
      return;
    }

    const payload: BookingRequest = {
      cafeId: this.selectedCafeId,
      tableId: this.selectedTableId,
      bookingDate: this.selectedDate,
      bookingTime: this.selectedTime,
      numberOfGuests: this.guestsCount,
    };

    this.bookingInProgress = true;
    this.alertService.loading("Booking table. Please wait.");
    this.menuService.createBooking(payload).subscribe({
      next: (booking) => {
        this.activeBooking = booking;
        this.journeyService.setActiveBooking(booking);
        this.bookingInProgress = false;
        this.alertService.close();
        this.alertService.success(
          "Table Booked",
          "Table booked successfully. You can now place your order.",
        );
      },
      error: (error) => {
        this.bookingInProgress = false;
        this.alertService.close();
        this.alertService.error(
          "Booking Failed",
          error?.error?.message || "Failed to book table",
        );
      },
    });
  }

  placeOrder(): void {
    if (!this.activeBooking?.id) {
      this.alertService.error("Booking is required before placing order.");
      return;
    }

    if (this.cart.length === 0) {
      this.alertService.error("Cart is empty.");
      return;
    }

    const payload: OrderRequest = {
      bookingId: this.activeBooking.id,
      items: this.cart.map((line) => ({
        menuItemId: line.item.id,
        quantity: line.quantity,
      })),
    };

    this.orderInProgress = true;
    this.alertService.loading("Placing your order. Please wait.");
    this.menuService.createOrder(payload).subscribe({
      next: (order) => {
        this.activeOrder = order;
        this.cart = [];
        this.orderInProgress = false;
        this.alertService.close();
        this.alertService.success(
          "Order Placed",
          "Proceed to payment to notify kitchen.",
        );
        this.subscribeToCustomerOrderTopic(order.id);
        this.router.navigate(["/customer/payment", order.id]);
      },
      error: (error) => {
        this.orderInProgress = false;
        this.alertService.close();
        this.alertService.error(
          "Order Failed",
          error?.error?.message || "Failed to place order",
        );
      },
    });
  }

  getStepState(step: OrderStatus): "done" | "active" | "pending" {
    if (!this.activeOrder) {
      return "pending";
    }
    const currentIndex = this.orderSteps.indexOf(
      this.activeOrder.status as OrderStatus,
    );
    const stepIndex = this.orderSteps.indexOf(step);
    if (stepIndex < currentIndex) return "done";
    if (stepIndex === currentIndex) return "active";
    return "pending";
  }

  private loadCafes(): void {
    this.loadingCafes = true;
    this.cafeBrowseService.getPublicCafes(0, 100).subscribe({
      next: (page) => {
        const cards = page?.content || [];
        if (cards.length > 0) {
          this.cafes = cards.map((card) => ({
            id: card.id,
            name: card.name,
            description: card.description || "",
            address: card.location || "",
            city: card.location || "",
            state: "",
            zipCode: "",
            phoneNumber: "",
            email: "",
            imageUrl: card.imageUrl,
            rating: card.rating || 0,
            openingTime: card.openTime || "",
            closingTime: card.closeTime || "",
            isActive: true,
            ownerId: 0,
            createdAt: "",
          }));
          this.afterCafesLoaded();
          return;
        }

        // Fallback to existing system active cafes endpoint if public list is empty.
        this.menuService.getSystemActiveCafes().subscribe({
          next: (cafes) => {
            this.cafes = cafes || [];
            if (this.cafes.length > 0) {
              this.afterCafesLoaded();
              return;
            }
            // Fallback to existing authenticated customer cafes endpoint.
            this.menuService.getActiveCafes().subscribe({
              next: (customerCafes) => {
                this.cafes = customerCafes || [];
                this.afterCafesLoaded();
              },
              error: () => {
                this.loadingCafes = false;
                this.alertService.error("Unable to load cafes.");
              },
            });
          },
          error: () => {
            this.menuService.getActiveCafes().subscribe({
              next: (customerCafes) => {
                this.cafes = customerCafes || [];
                this.afterCafesLoaded();
              },
              error: () => {
                this.loadingCafes = false;
                this.alertService.error("Unable to load cafes.");
              },
            });
          },
        });
      },
      error: () => {
        // Fallback chain: /cafes/active -> /customer/cafes
        this.menuService.getSystemActiveCafes().subscribe({
          next: (cafes) => {
            this.cafes = cafes || [];
            if (this.cafes.length > 0) {
              this.afterCafesLoaded();
              return;
            }
            this.menuService.getActiveCafes().subscribe({
              next: (customerCafes) => {
                this.cafes = customerCafes || [];
                this.afterCafesLoaded();
              },
              error: () => {
                this.loadingCafes = false;
                this.alertService.error("Unable to load cafes.");
              },
            });
          },
          error: () => {
            this.menuService.getActiveCafes().subscribe({
              next: (customerCafes) => {
                this.cafes = customerCafes || [];
                this.afterCafesLoaded();
              },
              error: () => {
                this.loadingCafes = false;
                this.alertService.error("Unable to load cafes.");
              },
            });
          },
        });
      },
    });
  }

  private afterCafesLoaded(): void {
    this.loadingCafes = false;
    if (!this.selectedCafeId && this.cafes.length > 0) {
      this.selectedCafeId = this.cafes[0].id;
      this.journeyService.setSelectedCafeId(this.selectedCafeId);
    }
    if (this.selectedCafeId) {
      this.webSocketService.subscribeToTableAvailability(this.selectedCafeId);
      this.loadMenuItems();
      this.loadAvailableTables();
    }
  }

  private loadMenuItems(): void {
    if (!this.selectedCafeId) return;
    this.loadingMenu = true;
    this.cafeBrowseService.getCafeDetails(this.selectedCafeId).subscribe({
      next: (detail) => {
        const publicItems = (detail?.menuItems || []).map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description || "",
          price: Number(item.price || 0),
          category: item.category || "OTHER",
          imageUrl: item.imageUrl,
          isAvailable: !!item.available,
          cafeId: this.selectedCafeId as number,
          cafeName: detail?.cafeDetails?.name,
        }));
        if (publicItems.length > 0) {
          this.menuItems = publicItems;
          this.categories = [
            "ALL",
            ...Array.from(
              new Set(
                this.menuItems
                  .map((m) => (m.category || "").toUpperCase())
                  .filter(Boolean),
              ),
            ),
          ];
          this.loadingMenu = false;
          return;
        }

        // Fallback to existing customer menu endpoint if public detail has no items.
        this.menuService.getMenuItems(this.selectedCafeId as number).subscribe({
          next: (items) => {
            this.menuItems = (items || []).map((item) => ({
              ...item,
              imageUrl:
                this.cafeBrowseService.resolveImageUrl(item.imageUrl) ||
                item.imageUrl,
              isAvailable: !!item.isAvailable,
            }));
            this.categories = [
              "ALL",
              ...Array.from(
                new Set(
                  this.menuItems
                    .map((m) => (m.category || "").toUpperCase())
                    .filter(Boolean),
                ),
              ),
            ];
            this.loadingMenu = false;
          },
          error: () => {
            this.loadingMenu = false;
            this.alertService.error("Unable to load menu items.");
          },
        });
      },
      error: () => {
        // Fallback to existing customer menu endpoint if public detail API fails.
        this.menuService.getMenuItems(this.selectedCafeId as number).subscribe({
          next: (items) => {
            this.menuItems = (items || []).map((item) => ({
              ...item,
              imageUrl:
                this.cafeBrowseService.resolveImageUrl(item.imageUrl) ||
                item.imageUrl,
              isAvailable: !!item.isAvailable,
            }));
            this.categories = [
              "ALL",
              ...Array.from(
                new Set(
                  this.menuItems
                    .map((m) => (m.category || "").toUpperCase())
                    .filter(Boolean),
                ),
              ),
            ];
            this.loadingMenu = false;
          },
          error: () => {
            this.loadingMenu = false;
            this.alertService.error("Unable to load menu items.");
          },
        });
      },
    });
  }

  private loadAvailableTables(): void {
    if (!this.selectedCafeId || !this.selectedDate || !this.selectedTime) {
      this.availableTables = [];
      return;
    }

    this.loadingTables = true;
    this.menuService
      .getAvailableTables(
        this.selectedCafeId,
        this.selectedDate,
        this.selectedTime,
        this.guestsCount,
      )
      .subscribe({
        next: (tables) => {
          this.availableTables = tables || [];
          if (
            !this.availableTables.some((t) => t.id === this.selectedTableId)
          ) {
            this.selectedTableId =
              this.availableTables.length > 0
                ? this.availableTables[0].id
                : null;
          }
          this.loadingTables = false;
        },
        error: () => {
          this.availableTables = [];
          this.loadingTables = false;
        },
      });
  }

  onBookingDateOrTimeChange(): void {
    this.selectedTableId = null;
    this.loadAvailableTables();
  }

  onGuestsChange(): void {
    if (this.guestsCount < 1) {
      this.guestsCount = 1;
    }
    if (this.guestsCount > 20) {
      this.guestsCount = 20;
    }
    this.selectedTableId = null;
    this.loadAvailableTables();
  }

  getCafeLocation(cafe: Cafe): string {
    return [cafe.city, cafe.state].filter(Boolean).join(", ");
  }

  categoryLabel(cat: string): string {
    if (!cat || cat === "ALL") return "All Categories";
    return cat
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  private subscribeToCustomerOrderTopic(orderId: number): void {
    if (this.orderTopicSub && this.activeOrder?.id) {
      this.webSocketService.unsubscribe(
        `/topic/customer-order/${this.activeOrder.id}`,
      );
    }

    this.orderTopicSub = this.webSocketService
      .watchDestination<any>(`/topic/customer-order/${orderId}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.refreshOrder());

    interval(8000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.activeOrder?.id === orderId) {
          this.refreshOrder();
        }
      });
  }

  private refreshOrder(): void {
    if (!this.activeOrder?.id) return;
    this.menuService.getOrderById(this.activeOrder.id).subscribe({
      next: (order) => {
        this.activeOrder = order;
      },
    });
  }

  private startBookingAvailabilityAutoRefresh(): void {
    this.webSocketService.tableAvailabilityUpdates$
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        if (!event || !this.selectedCafeId) {
          return;
        }
        if (Number(event.cafeId) !== this.selectedCafeId) {
          return;
        }
        if (String(event.bookingDate) !== String(this.selectedDate)) {
          return;
        }
        this.loadAvailableTables();
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
}
