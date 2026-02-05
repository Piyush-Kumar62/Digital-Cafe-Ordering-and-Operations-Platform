# 🍽️ Digital Café Ordering and Operations Platform

A modern, full-stack web application for managing café operations with online ordering, table booking, and real-time order management.

[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://openjdk.java.net/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.10-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Angular](https://img.shields.io/badge/Angular-20-red.svg)](https://angular.io/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue.svg)](https://www.mysql.com/)

---

## 📖 Table of Contents

- [Features](#-features)
- [Tech Stack](#%EF%B8%8F-tech-stack)
- [Architecture](#%EF%B8%8F-architecture)
- [Getting Started](#-getting-started)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [API Endpoints](#-api-endpoints)
- [Project Structure](#-project-structure)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### Customer Features

- 🔐 **User Authentication** - Secure registration and login with JWT
- 🍔 **Menu Browsing** - View menu items organized by categories
- 🛒 **Shopping Cart** - Add, update, and remove items
- 📅 **Table Booking** - Reserve tables for specific dates and times
- 📱 **Responsive Design** - Optimized for mobile and desktop
- 💳 **Order Management** - View order history and status

### Admin Features

- 👥 **User Management** - CRUD operations for users
- 🍕 **Menu Management** - Add, edit, delete menu items and categories
- 📊 **Order Tracking** - Monitor and update order statuses
- 🏢 **Café Management** - Manage café details and tables
- 📈 **Dashboard** - Analytics and overview

### Security Features

- 🔒 **JWT Authentication** - Secure token-based authentication
- 🛡️ **Role-Based Access** - Admin, Customer, Staff, Chef roles
- 🔑 **Password Encryption** - BCrypt hashing
- 🚫 **CORS Configuration** - Secure cross-origin requests

---

## 🛠️ Tech Stack

### Backend

| Technology      | Version | Purpose                        |
| --------------- | ------- | ------------------------------ |
| Java            | 21      | Programming Language           |
| Spring Boot     | 3.5.10  | Application Framework          |
| Spring Security | 3.5.10  | Authentication & Authorization |
| JWT             | 0.12.6  | Token-based Auth               |
| MySQL           | 8.0     | Database                       |
| Hibernate/JPA   | 3.5.10  | ORM                            |
| Maven           | 3.6+    | Build Tool                     |

### Frontend

| Technology         | Version | Purpose              |
| ------------------ | ------- | -------------------- |
| Angular            | 20      | Frontend Framework   |
| TypeScript         | 5.9     | Programming Language |
| Bootstrap          | 5.3     | CSS Framework        |
| RxJS               | 7.8     | Reactive Programming |
| Delicious Template | -       | UI Design            |

---

## 🏗️ Architecture

```
┌─────────────────────┐
│   Angular Frontend  │  http://localhost:4200
│  (Presentation)     │
└──────────┬──────────┘
           │
           │ REST API (HTTP/JSON)
           │
           ▼
┌─────────────────────┐
│  Spring Boot API    │  http://localhost:8080
│  (Business Logic)   │
│  - Controllers      │
│  - Services         │
│  - Repositories     │
└──────────┬──────────┘
           │
           │ JDBC/JPA
           │
           ▼
┌─────────────────────┐
│   MySQL Database    │  localhost:3306
│  (Data Storage)     │
└─────────────────────┘
```

### Application Layers

**Frontend (Angular):**

- Components → UI presentation
- Services → API communication
- Guards → Route protection
- Interceptors → HTTP request handling

**Backend (Spring Boot):**

- Controllers → Handle HTTP requests
- Services → Business logic
- Repositories → Database operations
- Models/Entities → Data structure
- DTOs → Data transfer objects
- Security → JWT authentication

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- ☕ **Java JDK 21** or higher
- 📦 **Node.js 18** or higher
- 🐬 **MySQL 8.0** or higher
- 🔨 **Maven 3.6+** (or use included Maven wrapper)
- 🅰️ **Angular CLI 20** (`npm install -g @angular/cli`)
- 💻 **Git** (for cloning the repository)

---

## 📥 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Piyush-Kumar62/Digital-Cafe-Ordering-and-Operations-Platform.git
cd Digital-Cafe-Ordering-and-Operations-Platform
```

### 2. Database Setup

**Create MySQL Database:**

```sql
CREATE DATABASE digital_cafe_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**Configure Database User (Optional):**

```sql
CREATE USER 'cafeuser'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON digital_cafe_db.* TO 'cafeuser'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Backend Setup

```bash
cd digital-cafe-backend

# Copy example configuration
cd src/main/resources
cp application.properties.example application.properties
```

**Edit `application.properties`:**

```properties
# Database Configuration
spring.datasource.url=jdbc:mysql://localhost:3306/digital_cafe_db
spring.datasource.username=root
spring.datasource.password=YOUR_MYSQL_PASSWORD

# JWT Secret (Generate a secure random string)
jwt.secret=YOUR_LONG_SECURE_RANDOM_SECRET_KEY_HERE
jwt.expiration=86400000

# Email Configuration (Optional)
spring.mail.username=YOUR_EMAIL@gmail.com
spring.mail.password=YOUR_APP_SPECIFIC_PASSWORD
```

**Build and Run:**

```bash
cd ../../..  # Back to digital-cafe-backend directory

# Using Maven Wrapper (Recommended)
./mvnw clean install
./mvnw spring-boot:run

# Or using Maven
mvn clean install
mvn spring-boot:run
```

The backend will start on **http://localhost:8080**

### 4. Frontend Setup

```bash
cd digital-cafe-frontend

# Install dependencies
npm install

# Start development server
ng serve

# Or for production build
ng build --configuration production
```

The frontend will start on **http://localhost:4200**

---

## ⚙️ Configuration

### Backend Configuration

The main configuration file is `application.properties`:

```properties
# Server Configuration
server.port=8080

# Database
spring.datasource.url=jdbc:mysql://localhost:3306/digital_cafe_db
spring.datasource.username=root
spring.datasource.password=your_password

# JPA/Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

# JWT
jwt.secret=your_secret_key
jwt.expiration=86400000
jwt.refresh-expiration=604800000

# CORS
app.frontend.url=http://localhost:4200
```

### Frontend Configuration

Environment files in `src/environments/`:

**development (`environment.ts`):**

```typescript
export const environment = {
  production: false,
  apiUrl: "http://localhost:8080",
};
```

**production (`environment.prod.ts`):**

```typescript
export const environment = {
  production: true,
  apiUrl: "https://your-production-api-url.com",
};
```

---

## 🏃 Running the Application

### Development Mode

**Terminal 1 - Backend:**

```bash
cd digital-cafe-backend
./mvnw spring-boot:run
```

**Terminal 2 - Frontend:**

```bash
cd digital-cafe-frontend
ng serve
```

**Access the application:**

- Frontend: http://localhost:4200
- Backend API: http://localhost:8080
- Swagger UI (if configured): http://localhost:8080/swagger-ui.html

### Default Users

After first run, you can create an admin user via registration or use these test credentials:

**Admin:**

- Username: `admin_master`
- Password: `admin123`

**Customer:**

- Username: `john.doe`
- Password: `password123`

---

## 📡 API Endpoints

### Authentication APIs

| Method | Endpoint                  | Description       | Auth Required |
| ------ | ------------------------- | ----------------- | ------------- |
| POST   | `/api/auth/register`      | Register new user | No            |
| POST   | `/api/auth/login`         | User login        | No            |
| POST   | `/api/auth/refresh-token` | Refresh JWT token | Yes           |
| POST   | `/api/auth/logout`        | User logout       | Yes           |

### User APIs

| Method | Endpoint          | Description    | Auth Required |
| ------ | ----------------- | -------------- | ------------- |
| GET    | `/api/users`      | Get all users  | Admin         |
| GET    | `/api/users/{id}` | Get user by ID | Yes           |
| PUT    | `/api/users/{id}` | Update user    | Admin/Self    |
| DELETE | `/api/users/{id}` | Delete user    | Admin         |

### Menu APIs

| Method | Endpoint               | Description         | Auth Required |
| ------ | ---------------------- | ------------------- | ------------- |
| GET    | `/api/menu-items`      | Get all menu items  | No            |
| GET    | `/api/menu-items/{id}` | Get menu item by ID | No            |
| POST   | `/api/menu-items`      | Create menu item    | Admin         |
| PUT    | `/api/menu-items/{id}` | Update menu item    | Admin         |
| DELETE | `/api/menu-items/{id}` | Delete menu item    | Admin         |

### Order APIs

| Method | Endpoint                    | Description         | Auth Required |
| ------ | --------------------------- | ------------------- | ------------- |
| GET    | `/api/orders`               | Get all orders      | Admin         |
| GET    | `/api/orders/user/{userId}` | Get user's orders   | Yes           |
| POST   | `/api/orders`               | Create new order    | Yes           |
| PUT    | `/api/orders/{id}/status`   | Update order status | Admin/Staff   |
| DELETE | `/api/orders/{id}`          | Cancel order        | Admin/Self    |

### Booking APIs

| Method | Endpoint                      | Description         | Auth Required |
| ------ | ----------------------------- | ------------------- | ------------- |
| GET    | `/api/bookings`               | Get all bookings    | Admin         |
| GET    | `/api/bookings/user/{userId}` | Get user's bookings | Yes           |
| POST   | `/api/bookings`               | Create booking      | Yes           |
| PUT    | `/api/bookings/{id}`          | Update booking      | Admin/Self    |
| DELETE | `/api/bookings/{id}`          | Cancel booking      | Admin/Self    |

### API Response Format

**Success Response:**

```json
{
  "status": "success",
  "data": {
    "id": 1,
    "username": "john.doe",
    "email": "john@example.com"
  },
  "message": "Operation successful"
}
```

**Error Response:**

```json
{
  "status": "error",
  "error": "UNAUTHORIZED",
  "message": "Invalid credentials",
  "timestamp": "2026-02-05T10:30:00"
}
```

---

## 📁 Project Structure

### Backend Structure

```
digital-cafe-backend/
├── src/
│   ├── main/
│   │   ├── java/com/digitalcafe/
│   │   │   ├── config/           # Security, JWT, CORS configs
│   │   │   ├── controller/       # REST API endpoints
│   │   │   ├── dto/              # Data Transfer Objects
│   │   │   ├── exception/        # Custom exceptions
│   │   │   ├── model/            # JPA entities
│   │   │   ├── repository/       # Database repositories
│   │   │   ├── service/          # Business logic
│   │   │   └── DigitalCafeBackendApplication.java
│   │   └── resources/
│   │       ├── application.properties.example
│   │       └── application.properties (create from example)
│   └── test/                     # Unit and integration tests
├── pom.xml                       # Maven dependencies
└── README.md
```

### Frontend Structure

```
digital-cafe-frontend/
├── src/
│   ├── app/
│   │   ├── core/                 # Core services, guards, interceptors
│   │   │   ├── guards/
│   │   │   ├── interceptors/
│   │   │   └── services/
│   │   ├── features/             # Feature modules
│   │   │   ├── auth/            # Login, Register
│   │   │   ├── home/            # Landing page
│   │   │   ├── menu/            # Menu display
│   │   │   └── cart/            # Shopping cart
│   │   ├── shared/               # Shared components
│   │   │   ├── components/      # Header, Footer
│   │   │   └── models/          # TypeScript interfaces
│   │   ├── app.routes.ts         # Routing configuration
│   │   └── app.ts                # Root component
│   ├── assets/                   # Images, CSS, JS
│   │   ├── img/
│   │   └── css/
│   ├── environments/             # Environment configs
│   └── index.html
├── angular.json                  # Angular configuration
├── package.json                  # NPM dependencies
└── tsconfig.json                 # TypeScript configuration
```

---

## 📸 Screenshots

### Landing Page

![Landing Page](docs/screenshots/landing.png)

### Menu Page

![Menu Page](docs/screenshots/menu.png)

### Admin Dashboard

![Admin Dashboard](docs/screenshots/dashboard.png)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Code Style

- **Java:** Follow Google Java Style Guide
- **TypeScript:** Follow Angular Style Guide
- **Comments:** Write clear, concise comments
- **Testing:** Add unit tests for new features

---

## 🐛 Known Issues

- Email verification feature requires SMTP configuration
- Payment gateway integration is pending
- Real-time notifications need WebSocket implementation

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

- **Piyush Kumar** - [@Piyush-Kumar62](https://github.com/Piyush-Kumar62)

---

## 🙏 Acknowledgments

- [Spring Boot](https://spring.io/projects/spring-boot) - Backend framework
- [Angular](https://angular.io/) - Frontend framework
- [Delicious Template](https://bootstrapmade.com/delicious-free-restaurant-bootstrap-theme/) - UI design
- [Bootstrap](https://getbootstrap.com/) - CSS framework

---

## 📞 Support

For support, email piyushkumar30066@gmail.com or create an issue in this repository.

---

## 🔗 Links

- **Repository:** https://github.com/Piyush-Kumar62/Digital-Cafe-Ordering-and-Operations-Platform
- **Issues:** https://github.com/Piyush-Kumar62/Digital-Cafe-Ordering-and-Operations-Platform/issues

---

**⭐ If you found this project helpful, please give it a star!**
