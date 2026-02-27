import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card" [ngClass]="{ 'card-hover': hoverable }">
      <div *ngIf="title" class="card-header">
        <h3 class="card-title">{{ title }}</h3>
        <ng-content select="[card-actions]"></ng-content>
      </div>
      <div class="card-content">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [
    `
      .card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        padding: 24px;
        transition: all 0.3s ease;
      }

      .card-hover:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        transform: translateY(-2px);
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 16px;
        border-bottom: 1px solid #e5e7eb;
      }

      .card-title {
        font-size: 20px;
        font-weight: 600;
        margin: 0;
        color: #1f2937;
      }

      .card-content {
        color: #4b5563;
      }
    `,
  ],
})
export class CardComponent {
  @Input() title: string = '';
  @Input() hoverable: boolean = false;
}
