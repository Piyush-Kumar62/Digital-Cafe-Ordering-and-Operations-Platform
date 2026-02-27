import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CustomerSidebarComponent } from './customer-sidebar/customer-sidebar';
import { CustomerHeaderComponent } from './customer-header/customer-header';

@Component({
  selector: 'app-customer-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, CustomerSidebarComponent, CustomerHeaderComponent],
  templateUrl: './customer-layout.component.html',
  styleUrls: ['./customer-layout.scss']
})
export class CustomerLayoutComponent { }
