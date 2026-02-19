import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { MenuItem } from '@shared/models/menu.model';
import { MenuService } from './menu.service';
import { CartService } from '../cart/cart.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {
  menuItems$!: Observable<MenuItem[]>;

  constructor(
    private menuService: MenuService,
    private cartService: CartService
  ) { }

  ngOnInit(): void {
    this.menuItems$ = this.menuService.getMenuItems();
  }

  addToCart(item: MenuItem): void {
    this.cartService.addItem(item);
    // Optionally, provide feedback to the user, e.g., via a toast notification.
    console.log(`${item.name} added to cart.`);
  }
}
