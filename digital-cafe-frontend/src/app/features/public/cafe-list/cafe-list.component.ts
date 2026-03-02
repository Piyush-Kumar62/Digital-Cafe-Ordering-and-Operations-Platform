import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { PublicCafeCard } from "@shared/models/cafe.model";
import { buildPublicFallbackCafes } from "@shared/data/featured-cafes.data";
import { CafeBrowseService } from "../cafe-browse.service";

@Component({
  selector: "app-cafe-list",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./cafe-list.component.html",
  styleUrl: "./cafe-list.component.scss",
})
export class CafeListComponent implements OnInit {
  cafes: PublicCafeCard[] = [];
  loading = true;
  page = 0;
  size = 9;
  totalPages = 0;

  constructor(
    private cafeBrowseService: CafeBrowseService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  openCafe(cafeId: number): void {
    this.router.navigate(["/cafes", cafeId]);
  }

  previous(): void {
    if (this.page <= 0) {
      return;
    }
    this.page -= 1;
    this.load();
  }

  next(): void {
    if (this.page + 1 >= this.totalPages) {
      return;
    }
    this.page += 1;
    this.load();
  }

  private load(): void {
    this.loading = true;
    this.cafeBrowseService.getPublicCafes(this.page, this.size).subscribe({
      next: (res) => {
        const content = res.content || [];
        this.cafes = content.length > 0 ? content : buildPublicFallbackCafes();
        this.totalPages = content.length > 0 ? (res.totalPages || 0) : 1;
        this.loading = false;
      },
      error: () => {
        this.cafes = buildPublicFallbackCafes();
        this.totalPages = 1;
        this.loading = false;
      },
    });
  }
}
