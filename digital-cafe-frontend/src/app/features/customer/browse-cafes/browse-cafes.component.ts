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
  readonly pageSize = 10;

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
    return this.filteredCafes.slice(
      this.pageIndex * this.pageSize,
      (this.pageIndex + 1) * this.pageSize,
    );
  }
  get totalElements(): number {
    return this.filteredCafes.length;
  }
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalElements / this.pageSize));
  }
  get rangeStart(): number {
    return this.totalElements === 0 ? 0 : this.pageIndex * this.pageSize + 1;
  }
  get rangeEnd(): number {
    return Math.min((this.pageIndex + 1) * this.pageSize, this.totalElements);
  }
  get allPages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }
  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.pageIndex = page;
  }
  onSearchChange(): void {
    this.pageIndex = 0;
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
          return this.cafeBrowseService.getPublicCafes(0, 50).pipe(
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

  retry(): void {
    this.error = false;
    this.loading = true;
    this.cafeBrowseService
      .getPublicCafes(0, 50)
      .pipe(catchError(() => of(null)))
      .subscribe((res) => {
        this.cafes = res?.content || [];
        this.loading = false;
        this.error = !res;
      });
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
}
