import { Component, OnDestroy, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { interval, Subject, of } from "rxjs";
import { switchMap, startWith, takeUntil, catchError } from "rxjs/operators";
import { CafeBrowseService } from "@features/public/cafe-browse.service";
import { PublicCafeCard } from "@shared/models/cafe.model";

@Component({
  selector: "app-browse-cafes",
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: "./browse-cafes.component.html",
  styleUrls: ["./browse-cafes.component.scss"],
})
export class BrowseCafesComponent implements OnInit, OnDestroy {
  cafes: PublicCafeCard[] = [];
  loading = true;
  error = false;
  searchQuery = "";

  private readonly POLL_MS = 30_000;
  private destroy$ = new Subject<void>();

  pageIndex = 0;
  readonly pageSize = 9;
  totalElements = 0;
  totalPages = 0;

  get filteredCafes(): PublicCafeCard[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.cafes;
    return this.cafes.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.location?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q),
    );
  }

  get pagedCafes(): PublicCafeCard[] {
    return this.filteredCafes;
  }
  get rangeStart(): number {
    return this.totalElements === 0 ? 0 : this.pageIndex * this.pageSize + 1;
  }
  get rangeEnd(): number {
    return Math.min((this.pageIndex + 1) * this.pageSize, this.totalElements);
  }
  get allPages(): number[] {
    return Array.from({ length: Math.max(this.totalPages, 1) }, (_, i) => i);
  }
  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.pageIndex = page;
    this.loadPage(this.pageIndex);
  }

  constructor(
    private cafeBrowseService: CafeBrowseService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    interval(this.POLL_MS)
      .pipe(
        startWith(0),
        switchMap(() => {
          this.loading = true;
          this.error = false;
          return this.cafeBrowseService
            .getPublicCafes(this.pageIndex, this.pageSize)
            .pipe(
            catchError(() => {
              this.error = true;
              this.loading = false;
              return of(null);
            }),
            );
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((res) => {
        if (res) {
          this.cafes = res.content || [];
          this.totalPages = res.totalPages || 0;
          this.totalElements = res.totalElements || 0;
          this.loading = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openCafe(cafeId: number): void {
    this.router.navigate(["/customer/browse-cafes", cafeId]);
  }

  viewMenu(cafeId: number, event?: Event): void {
    event?.stopPropagation();
    this.router.navigate(["/customer/browse-cafes", cafeId]);
  }

  bookTable(cafeId: number, event?: Event): void {
    event?.stopPropagation();
    this.router.navigate(["/customer/booking"], { queryParams: { cafeId } });
  }

  retry(): void {
    this.loadPage(this.pageIndex);
  }

  fmt12h(val: string | undefined | null): string {
    if (!val) return "";
    const m = val.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return val;
    let h = Number(m[1]);
    const min = m[2];
    const meridian = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${min} ${meridian}`;
  }

  private loadPage(page: number): void {
    this.loading = true;
    this.error = false;
    this.cafeBrowseService.getPublicCafes(page, this.pageSize).subscribe({
      next: (res) => {
        this.cafes = res.content || [];
        this.totalPages = res.totalPages || 0;
        this.totalElements = res.totalElements || 0;
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      },
    });
  }
}
