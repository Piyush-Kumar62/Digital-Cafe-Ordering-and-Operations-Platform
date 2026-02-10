# Digital Café Platform - Angular Frontend

An enterprise-grade Angular 20 frontend application for the Digital Café Ordering and Operations Platform.

## Features

- 🎨 Modern, responsive UI with Angular Material & Tailwind CSS
- 🔐 Complete JWT authentication system
- 👥 Role-based access control (Admin, Café Owner, Chef, Waiter, Customer)
- 📱 Mobile-first responsive design
- ⚡ Real-time WebSocket updates
- 🎭 Smooth animations and transitions
- 📊 Dynamic dashboards for each user role
- 🛒 Order management and tracking
- 📅 Table booking system
- 💳 Payment integration ready

## Tech Stack

- Angular 20 (Standalone Components)
- TypeScript (Strict Mode)
- Angular Material
- Tailwind CSS
- RxJS
- SockJS + STOMP (WebSocket)
- Angular Animations

## Project Structure

```
src/app/
├── core/                    # Core functionality
│   ├── auth/               # Authentication service
│   ├── guards/             # Route guards
│   ├── interceptors/       # HTTP interceptors
│   ├── services/           # Core services
│   └── websocket/          # WebSocket service
├── shared/                 # Shared resources
│   ├── components/         # Reusable components
│   ├── models/            # TypeScript interfaces
│   ├── pipes/             # Custom pipes
│   └── directives/        # Custom directives
├── features/              # Feature modules
│   ├── landing/          # Landing page
│   ├── auth/             # Authentication
│   ├── admin/            # Admin dashboard
│   ├── cafe-owner/       # Owner dashboard
│   ├── chef/             # Chef dashboard
│   ├── waiter/           # Waiter dashboard
│   └── customer/         # Customer dashboard
└── layouts/              # Layout components
```

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- Angular CLI 20.x

### Installation

1. Install dependencies:

```bash
npm install
```

2. Configure environment:
   Edit `src/environments/environment.development.ts` to match your backend API:

```typescript
export const environment = {
  production: false,
  apiUrl: "http://localhost:8080/api",
  wsUrl: "http://localhost:8080/ws",
  // ... other config
};
```

### Development

Run the development server:

```bash
npm start
```

Navigate to `http://localhost:4200/`

### Build

Build the application:

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Available User Roles

1. **Admin** - Platform management
2. **Café Owner** - Café and staff management
3. **Chef** - Kitchen operations and order preparation
4. **Waiter** - Order serving and customer service
5. **Customer** - Browse cafés, order food, book tables

## Key Features by Role

### Customer

- Browse and search cafés
- View menus and order food
- Book tables in advance
- Track order status in real-time
- Payment processing
- Order history

### Chef

- View pending orders
- Update order status (Preparing, Ready)
- Real-time order notifications
- Kitchen dashboard

### Waiter

- View ready orders
- Mark orders as served
- Manage customer requests

### Café Owner

- Manage café profile
- Menu management
- Table management
- Staff management (create chefs, waiters)
- View orders and bookings
- Dashboard analytics

### Admin

- Manage all users
- Activate/deactivate café owners
- Platform-wide statistics
- System monitoring

## Authentication Flow

1. User registers → Email verification required
2. Email verified → Login allowed
3. First login → Password reset (if required)
4. Customer → Profile completion wizard
5. Redirect to role-based dashboard

## WebSocket Integration

Real-time features using SockJS + STOMP:

- Order status updates
- New order notifications for chefs
- Ready order notifications for waiters
- Live dashboard updates

## API Integration

All API calls are typed and use Angular HttpClient with:

- JWT token auto-injection
- Global error handling
- Loading indicators
- Toast notifications

## Guards

- `authGuard` - Requires authentication
- `roleGuard` - Role-based access control
- `emailVerificationGuard` - Ensures email is verified
- `profileCompletionGuard` - Ensures customer profile is complete

## Styling

The application uses a combination of:

- Tailwind CSS for utility classes
- Angular Material for components
- Custom SCSS for specific styling
- Responsive breakpoints for mobile support

## Environment Variables

Key configuration in `src/environments/`:

- `apiUrl` - Backend API base URL
- `wsUrl` - WebSocket endpoint URL
- `tokenKey` - Local storage key for JWT token
- `userKey` - Local storage key for user data

## Deployment

### Building for Deployment

1. Build the application:

```bash
npm run build
```

2. Configure environment in `src/environments/environment.ts` for deployment

3. Deploy the `dist/` folder to your hosting service:
   - Nginx
   - Apache
   - Firebase Hosting
   - Netlify
   - Vercel
   - AWS S3 + CloudFront

## Contributing

This is a complete, enterprise-grade application built following Angular best practices:

- Strict TypeScript mode
- Standalone components architecture
- Lazy-loaded routes
- Reactive programming with RxJS
- Clean, maintainable code structure

## License

This project is part of the Digital Café Platform.
