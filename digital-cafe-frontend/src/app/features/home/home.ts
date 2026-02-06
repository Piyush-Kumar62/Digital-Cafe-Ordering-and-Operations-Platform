import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Hero } from './components/hero/hero';
import { About } from './components/about/about';
import { WhyUs } from './components/why-us/why-us';
import { Menu } from '../menu/menu';
import { Specials } from './components/specials/specials';
import { Events } from './components/events/events';
import { Booking } from './components/booking/booking';
import { Gallery } from './components/gallery/gallery';
import { Chefs } from './components/chefs/chefs';
import { Testimonials } from './components/testimonials/testimonials';
import { Contact } from './components/contact/contact';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    Hero,
    About,
    WhyUs,
    Menu,
    Specials,
    Events,
    Booking,
    Gallery,
    Chefs,
    Testimonials,
    Contact,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  // Bootstrap carousel and components handle UI interactions
}
