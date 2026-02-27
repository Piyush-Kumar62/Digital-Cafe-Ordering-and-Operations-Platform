import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from "@angular/core";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-cta",
  standalone: true,
  imports: [RouterModule],
  templateUrl: "./cta.component.html",
  styleUrl: "./cta.component.scss",
})
export class CtaComponent implements AfterViewInit, OnDestroy {
  @ViewChild("ctaSection", { static: true }) ctaSection?: ElementRef<HTMLElement>;
  isVisible = false;
  private observer?: IntersectionObserver;

  ngAfterViewInit(): void {
    if (!this.ctaSection) {
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.isVisible = true;
            this.observer?.disconnect();
          }
        });
      },
      { threshold: 0.25, rootMargin: "0px 0px -60px 0px" },
    );

    this.observer.observe(this.ctaSection.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}

