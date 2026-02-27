import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ApiService } from "@core/services/api.service";
import { AuthService } from "@core/auth/auth.service";
import { AlertService } from "@core/services/alert.service";
import { Table } from "@shared/models/cafe.model";

@Component({
  selector: "app-owner-tables",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="owner-page">
      <header class="page-header">
        <h1>Table Management</h1>
        <p>Add tables and control availability.</p>
      </header>

      <form class="card form-grid" (ngSubmit)="createTable()">
        <input [(ngModel)]="tableNumber" name="tableNumber" placeholder="Table number (e.g. T-01)" required />
        <input [(ngModel)]="capacity" name="capacity" type="number" min="1" placeholder="Capacity" required />
        <button type="submit">Add Table</button>
      </form>

      <div class="grid">
        <article class="card item" *ngFor="let table of tables">
          <div>
            <h3>{{ table.tableNumber }}</h3>
            <p>Capacity: {{ table.capacity }}</p>
          </div>
          <div class="actions">
            <span [class.ok]="table.isAvailable" [class.bad]="!table.isAvailable">
              {{ table.isAvailable ? 'Available' : 'Unavailable' }}
            </span>
            <button (click)="toggleAvailability(table)">
              {{ table.isAvailable ? 'Disable' : 'Enable' }}
            </button>
          </div>
        </article>
      </div>
    </section>
  `,
  styles: [`
    .owner-page { padding: 1rem; color: #0f172a; }
    .page-header { margin-bottom: 1rem; }
    .page-header h1 { margin: 0; }
    .page-header p { margin: .35rem 0 0; color: #64748b; }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: .9rem; box-shadow: 0 6px 18px rgba(2, 6, 23, .06); }
    .form-grid { display: grid; gap: .7rem; grid-template-columns: 1fr 1fr auto; margin-bottom: 1rem; }
    input, button { border: 1px solid #cbd5e1; border-radius: 10px; padding: .55rem .65rem; font: inherit; }
    button { background: #0ea5e9; color: #fff; border: 0; font-weight: 700; cursor: pointer; }
    .grid { display: grid; gap: .8rem; }
    .item { display: flex; justify-content: space-between; align-items: center; gap: .8rem; }
    .item h3 { margin: 0; }
    .item p { margin: .2rem 0 0; color: #64748b; font-size: .9rem; }
    .actions { display: flex; align-items: center; gap: .45rem; }
    .actions span { font-size: .8rem; font-weight: 700; padding: .2rem .45rem; border-radius: 999px; }
    .actions .ok { background: #dcfce7; color: #166534; }
    .actions .bad { background: #fee2e2; color: #991b1b; }
    @media (max-width: 768px) { .form-grid { grid-template-columns: 1fr; } .item { flex-direction: column; align-items: flex-start; } }
  `],
})
export class OwnerTablesComponent implements OnInit {
  cafeId: number | null = null;
  tables: Table[] = [];
  tableNumber = "";
  capacity = 2;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.cafeId = this.authService.currentUserValue?.cafeId || null;
    this.loadTables();
  }

  loadTables(): void {
    if (!this.cafeId) return;
    this.apiService.getTablesByCafe(this.cafeId).subscribe({
      next: (tables) => this.tables = tables || [],
    });
  }

  createTable(): void {
    if (!this.cafeId) return;
    this.alertService.loading("Adding table. Please wait.");
    this.apiService.createTable(this.cafeId, {
      tableNumber: this.tableNumber,
      capacity: this.capacity,
    }).subscribe({
      next: () => {
        this.alertService.close();
        this.alertService.success("Table Added", "Table added successfully.");
        this.tableNumber = "";
        this.capacity = 2;
        this.loadTables();
      },
      error: () => {
        this.alertService.close();
        this.alertService.error("Create Failed", "Failed to create table.");
      },
    });
  }

  async toggleAvailability(table: Table): Promise<void> {
    const action = table.isAvailable ? "Disable" : "Enable";
    const confirmed = await this.alertService.confirm("Update Table Status", `${action} table ${table.tableNumber}?`);
    if (!confirmed) {
      return;
    }

    this.alertService.loading("Updating table status. Please wait.");
    this.apiService.toggleTableStatus(table.id, !table.isAvailable).subscribe({
      next: () => {
        this.alertService.close();
        this.loadTables();
      },
      error: () => {
        this.alertService.close();
        this.alertService.error("Update Failed", "Failed to update table.");
      },
    });
  }
}


