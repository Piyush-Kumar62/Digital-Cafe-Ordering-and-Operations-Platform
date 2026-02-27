import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { PublicCafeCard } from "@shared/models/cafe.model";
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
        this.cafes = res.content || [];
        this.totalPages = res.totalPages || 0;
        this.loading = false;
      },
      error: () => {
        this.cafes = [];
        this.loading = false;
      },
    });
  }
}
