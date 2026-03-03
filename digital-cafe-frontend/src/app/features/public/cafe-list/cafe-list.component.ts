import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { Router, RouterModule, NavigationEnd } from "@angular/router";
import { interval, Subject, of } from "rxjs";
import {
  filter,
  switchMap,
  startWith,
  takeUntil,
  catchError,
} from "rxjs/operators";
import { PublicCafeCard } from "@shared/models/cafe.model";
import { CafeBrowseService } from "../cafe-browse.service";
import { NavbarComponent } from "@shared/components/navbar/navbar.component";
import { FooterComponent } from "@shared/components/footer/footer.component";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "app-cafe-list",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NavbarComponent,
    FooterComponent,
    FormsModule,
  ],
  templateUrl: "./cafe-list.component.html",
  styleUrl: "./cafe-list.component.scss",
})
export class CafeListComponent implements OnInit, OnDestroy {
  cafes: PublicCafeCard[] = [];
  loading = true;
  error = false;
  page = 0;
  size = 9;
  totalPages = 0;
  searchQuery = "";

  private readonly POLL_INTERVAL_MS = 30_000;
  private destroy$ = new Subject<void>();

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

  constructor(
    private cafeBrowseService: CafeBrowseService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // Single polling stream (refreshes every 30s).
    // NavigationEnd to /cafes resets the stream so fresh data loads immediately.
    const onCafesRoute$ = this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      filter(
        (e: any) =>
          (e as NavigationEnd).urlAfterRedirects.startsWith("/cafes") &&
          !(e as NavigationEnd).urlAfterRedirects.match(/\/cafes\/\d/),
      ),
      startWith(null), // fire once on component init
      takeUntil(this.destroy$),
    );

    onCafesRoute$
      .pipe(
        switchMap(() =>
          interval(this.POLL_INTERVAL_MS).pipe(
            startWith(0),
            takeUntil(this.destroy$),
          ),
        ),
        switchMap(() => {
          this.loading = true;
          this.error = false;
          return this.cafeBrowseService
            .getPublicCafes(this.page, this.size)
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
        }
        this.loading = false;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openCafe(cafeId: number): void {
    this.router.navigate(["/cafes", cafeId]);
  }

  previous(): void {
    if (this.page <= 0) return;
    this.page -= 1;
    this.loadPage(this.page);
  }

  next(): void {
    if (this.page + 1 >= this.totalPages) return;
    this.page += 1;
    this.loadPage(this.page);
  }

  retry(): void {
    this.loadPage(this.page);
  }

  /** Convert "HH:MM" 24-hour string → "H:MM AM/PM", blank stays blank */
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
    this.cafeBrowseService.getPublicCafes(page, this.size).subscribe({
      next: (res) => {
        this.cafes = res.content || [];
        this.totalPages = res.totalPages || 0;
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      },
    });
  }
}
