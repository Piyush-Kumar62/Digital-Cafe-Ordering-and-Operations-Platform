import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '@core/services/loading.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss'],
})
export class LoadingComponent implements OnInit, OnDestroy {
  isLoading = false;
  private destroy$ = new Subject<void>();

  constructor(private loadingService: LoadingService) {}

  ngOnInit(): void {
    this.loadingService.loading$.pipe(takeUntil(this.destroy$)).subscribe((loading) => {
      this.isLoading = loading;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
