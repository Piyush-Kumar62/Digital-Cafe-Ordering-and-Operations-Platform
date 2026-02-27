import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxChartsModule } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [CommonModule, NgxChartsModule],
  templateUrl: './chart.html',
  styleUrls: ['./chart.scss']
})
export class ChartComponent {
  @Input() data: any[] = [];
  @Input() chartType: 'bar-vertical' | 'pie' | 'line' = 'bar-vertical';
  @Input() showXAxis = true;
  @Input() showYAxis = true;
  @Input() showLegend = true;
  @Input() showXAxisLabel = true;
  @Input() showYAxisLabel = true;
  @Input() showPieLabels = true;
  @Input() xAxisLabel = '';
  @Input() yAxisLabel = '';
  @Input() height = 280;

  view: [number, number] = [640, 280];

  @Output() selectEvent = new EventEmitter();

  ngOnInit(): void {
    this.updateView();
  }

  ngOnChanges(): void {
    this.updateView();
  }

  private updateView(): void {
    const width = Math.max(280, window.innerWidth < 768 ? window.innerWidth - 96 : 620);
    this.view = [width, this.height];
  }

  hasData(): boolean {
    if (!Array.isArray(this.data) || this.data.length === 0) return false;
    if (this.chartType === 'line') {
      return this.data.some(item =>
        Array.isArray(item?.series) &&
        item.series.some((point: any) => Number(point?.value || 0) > 0),
      );
    }
    return this.data.some(item => Number(item?.value || 0) > 0);
  }

  onSelect(event: any) {
    this.selectEvent.emit(event);
  }
}
