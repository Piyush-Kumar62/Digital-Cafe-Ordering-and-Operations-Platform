import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableService } from '../services/table-service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-owner-tables',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './owner-tables.component.html',
  styleUrls: ['./owner-tables.component.scss']
})
export class OwnerTablesComponent implements OnInit {

  tables: any[] = [];
  loading = true;

  // 🔹 Modal Controls
  showForm = false;
  isEditMode = false;

  formCapacity: number | null = null;
  selectedTableId: number | null = null;

  constructor(
    private tableService: TableService,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.loadTables();
  }

  // 🔹 Go Back
  goBack(): void {
    this.location.back();
  }

  // 🔹 Load Tables
  loadTables(): void {
    this.loading = true;

    this.tableService.getMyTables().subscribe({
      next: (res: any) => {
        this.tables = res.data || res;

        // 🔥 IMPORTANT: Ensure boolean is correct
        this.tables = this.tables.map((t: any) => ({
          ...t,
          isAvailable: t.isAvailable === true
        }));

        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  // 🔹 Open Add Modal
  openAddForm(): void {
    this.showForm = true;
    this.isEditMode = false;
    this.formCapacity = null;
  }

  // 🔹 Close Modal
  closeForm(): void {
    this.showForm = false;
    this.formCapacity = null;
    this.selectedTableId = null;
  }

  // 🔹 Add Table
  addTable(): void {
    if (!this.formCapacity) return;

    this.tableService.createTable({ capacity: this.formCapacity })
      .subscribe(() => {
        this.closeForm();
        this.loadTables();   // reload from DB (correct status)
      });
  }

  // 🔹 Start Edit
  startEdit(table: any): void {
    this.showForm = true;
    this.isEditMode = true;
    this.selectedTableId = table.id;
    this.formCapacity = table.capacity;
  }

  // 🔹 Update Table
  updateTable(): void {
    if (!this.formCapacity || !this.selectedTableId) return;

    this.tableService.updateTable(this.selectedTableId, {
      capacity: this.formCapacity
    }).subscribe(() => {
      this.closeForm();
      this.loadTables();
    });
  }

  // 🔹 Toggle Availability (✅ FIXED)
  toggleAvailability(table: any): void {

    const newStatus = !table.isAvailable;

    this.tableService.toggleAvailability(table.id, newStatus)
      .subscribe(() => {
        table.isAvailable = newStatus;
      });
  }
}