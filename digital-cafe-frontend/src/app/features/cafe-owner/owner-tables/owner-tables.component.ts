import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '@core/services/api.service';
import { TableService } from '../services/table-service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-owner-tables',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './owner-tables.component.html',
  styleUrls: ['./owner-tables.component.scss'],
})
export class OwnerTablesComponent implements OnInit {

  tables: any[] = [];
  loading = true;
  saving = false;
  deleting: number | null = null;

  showForm = false;
  isEditMode = false;

  formCapacity: number | null = null;
  formTableNumber: number | null = null;
  selectedTableId: number | null = null;

  confirmDeleteId: number | null = null;

  constructor(
    private apiService: ApiService,
    private tableService: TableService,
    private location: Location,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.apiService.cafeExistsForOwner().subscribe({
      next: (exists) => {
        if (!exists) { this.router.navigate(['/owner/setup']); return; }
        this.loadTables();
      },
      error: () => this.router.navigate(['/owner/setup']),
    });
  }

  goBack(): void { this.location.back(); }

  loadTables(): void {
    this.loading = true;
    this.tableService.getMyTables().subscribe({
      next: (res: any) => {
        this.tables = (res.data || res).map((t: any) => ({ ...t, isAvailable: t.isAvailable === true }));
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        const msg = err?.error?.message?.toLowerCase?.() || err?.message?.toLowerCase?.() || '';
        if (err?.status === 404 || err?.status === 400 || msg.includes('not found')) {
          this.router.navigate(['/owner/setup']);
        }
      },
    });
  }

  get availableCount(): number { return this.tables.filter((t) => t.isAvailable).length; }
  get occupiedCount():  number { return this.tables.filter((t) => !t.isAvailable).length; }

  openAddForm(): void {
    this.showForm = true;
    this.isEditMode = false;
    this.formCapacity = null;
    this.formTableNumber = null;
  }

  closeForm(): void {
    this.showForm = false;
    this.formCapacity = null;
    this.formTableNumber = null;
    this.selectedTableId = null;
  }

  addTable(): void {
    if (!this.formCapacity) return;
    this.saving = true;
    const payload: any = { capacity: this.formCapacity };
    if (this.formTableNumber) payload.tableNumber = this.formTableNumber;
    this.tableService.createTable(payload).subscribe({
      next: () => { this.closeForm(); this.loadTables(); this.saving = false; },
      error: () => { this.saving = false; },
    });
  }

  startEdit(table: any): void {
    this.showForm = true;
    this.isEditMode = true;
    this.selectedTableId = table.id;
    this.formCapacity = table.capacity;
    this.formTableNumber = table.tableNumber ?? null;
  }

  updateTable(): void {
    if (!this.formCapacity || !this.selectedTableId) return;
    this.saving = true;
    const payload: any = { capacity: this.formCapacity };
    if (this.formTableNumber) payload.tableNumber = this.formTableNumber;
    this.tableService.updateTable(this.selectedTableId, payload).subscribe({
      next: () => { this.closeForm(); this.loadTables(); this.saving = false; },
      error: () => { this.saving = false; },
    });
  }

  toggleAvailability(table: any): void {
    const newStatus = !table.isAvailable;
    this.tableService.toggleAvailability(table.id, newStatus).subscribe({
      next: () => { table.isAvailable = newStatus; },
    });
  }

  askDelete(id: number): void { this.confirmDeleteId = id; }
  cancelDelete(): void { this.confirmDeleteId = null; }

  confirmDelete(): void {
    if (!this.confirmDeleteId) return;
    this.deleting = this.confirmDeleteId;
    this.tableService.deleteTable(this.confirmDeleteId).subscribe({
      next: () => {
        this.tables = this.tables.filter((t) => t.id !== this.confirmDeleteId);
        this.confirmDeleteId = null;
        this.deleting = null;
      },
      error: () => { this.deleting = null; this.confirmDeleteId = null; },
    });
  }
}
