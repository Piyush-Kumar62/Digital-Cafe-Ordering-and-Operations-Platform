import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.html',
  styleUrls: ['./card.scss']
})
export class CardComponent {
  @Input() title = '';
  @Input() icon = '';
  @Input() value: string | number = '';
  @Input() description = '';
  @Input() variant: 'blue' | 'teal' | 'violet' | 'orange' | 'rose' | 'indigo' = 'blue';
}
