<div align="center">

# ☕ Digital Café Ordering and Operations Platform

**A production-ready full-stack platform for managing café operations with real-time order tracking, online payments, and multi-role dashboards**

[![Java](https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.x-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Angular](https://img.shields.io/badge/Angular-20-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.io/)
[![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![AWS](https://img.shields.io/badge/AWS-EC2%20%7C%20RDS%20%7C%20S3-232F3E?style=for-the-badge&logo=amazonaws&logoColor=white)](https://aws.amazon.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

</div>

---

## 📖 Overview

Digital Café is a scalable, enterprise-grade platform that digitizes the complete café workflow — from table booking and menu browsing to order processing and online payments.

It supports **multiple user roles** with dedicated dashboards and uses **real-time WebSocket communication** for instant order updates.

---

## 🔗 Live Links

- Frontend: https://cafehub.tech
- Backend API: https://api.cafehub.tech/api
- API Docs: https://api.cafehub.tech/swagger-ui.html

---

## 📌 Problem Statement

Traditional café operations rely on manual processes, leading to:

- Delays in order handling
- Human errors
- Lack of real-time visibility
- Poor customer experience

---

## ✅ Solution

This platform provides:

- Digital ordering and booking system
- Real-time order tracking
- Role-based operational dashboards
- Secure online payments

---

## ✨ Core Features

### 👤 Customer

- Browse cafes and menus
- Book tables with availability checks
- Place orders and track status in real-time
- Pay online

### 🧑‍🍳 Chef

- Live order queue
- Update status: `PENDING → PREPARING → READY`

### 🧑‍💼 Waiter

- Ready order pickup queue
- Update status: `READY → SERVED`

### 🏪 Cafe Owner

- Manage menu, tables, and staff
- Monitor orders and operations

### 🛠️ Admin

- Manage users and cafe owners
- Platform-level monitoring

---

## 🛠️ Tech Stack

### Backend

- Java 21
- Spring Boot
- Spring Security (JWT)
- Spring Data JPA (Hibernate)
- WebSocket (STOMP)
- MySQL

### Frontend

- Angular
- TypeScript
- RxJS
- Tailwind CSS / PrimeNG

### Infrastructure

- Docker & Docker Compose
- Nginx (reverse proxy)
- AWS (EC2, RDS, S3)
- GitHub Actions (CI/CD)

---

## 🧠 System Architecture

```
[Angular SPA]
   |
   | HTTPS + JWT + WebSocket
   v
[Nginx Reverse Proxy]
   |
   +--> [Spring Boot API]
            |
            +--> [MySQL]
            +--> [S3 / Local Storage]
            +--> [Payment Gateway / SMTP]
```

---

## 🏗️ Architecture Style

- Modular Monolith (feature-based design recommended)
- REST APIs + WebSocket for real-time updates
- Stateless authentication using JWT

---

## 🧩 Key Design Decisions

- **JWT Authentication** → scalable, stateless sessions
- **DTO Pattern** → decouples API from entity model
- **Role-Based Access Control** → secure endpoints
- **Centralized Exception Handling** → consistent API responses
- **WebSocket Updates** → eliminates polling and improves UX

---

## 🗄️ Database Design

Core entities:

- Users, Roles
- Cafes, Tables, Menu Items
- Bookings
- Orders, Order Items
- Payments

### Scalability Considerations

- Normalized schema
- Indexed queries for performance
- Ready for Redis caching and read replicas

---

## 📡 API Overview

| Method | Endpoint                | Description           |
| ------ | ----------------------- | --------------------- |
| POST   | /api/auth/login         | User authentication   |
| GET    | /api/cafes/active       | List cafes            |
| POST   | /api/bookings           | Create booking        |
| POST   | /api/orders             | Place order           |
| PUT    | /api/orders/{id}/ready  | Chef updates status   |
| PUT    | /api/orders/{id}/served | Waiter updates status |
| POST   | /api/payments/initiate  | Start payment         |
| POST   | /api/payments/verify    | Verify payment        |

---

## 📁 Project Structure

```
digital-cafe-backend/
 ├── core/               # shared configs, security, utils
 ├── modules/            # feature-based modules (auth, order, etc.)
 ├── infrastructure/     # external integrations
 └── resources/

digital-cafe-frontend/
 ├── core/
 ├── features/
 └── shared/

infra/
 ├── docker/
 ├── nginx/
 └── scripts/
```

---

## ⚙️ Setup Instructions

### 1. Clone Repository

```bash
git clone https://github.com/Piyush-Kumar62/Digital-Cafe-Ordering-and-Operations-Platform.git
cd Digital-Cafe-Ordering-and-Operations-Platform
```

---

### 2. Backend Configuration (IMPORTANT)

Use Spring profiles instead of `.env` files:

```
application.yml
application-dev.yml
application-prod.yml
```

Run with:

```bash
SPRING_PROFILES_ACTIVE=dev
```

---

### 3. Run Backend

```bash
cd digital-cafe-backend
./mvnw spring-boot:run
```

Backend runs at: `http://localhost:8080`

---

### 4. Run Frontend

```bash
cd digital-cafe-frontend
npm install
npm start
```

Frontend runs at: `http://localhost:4200`

---

## 🚀 Deployment

- Dockerized services
- AWS EC2 for hosting
- AWS RDS for database
- Nginx for reverse proxy & HTTPS
- AWS S3 for static/media storage

---

## 🔐 Security

- JWT-based authentication
- BCrypt password hashing
- Role-based authorization
- CORS configuration
- Secure environment variable handling

---

## 📈 Future Improvements

- Redis caching
- Kafka event-driven architecture
- OpenTelemetry monitoring
- Rate limiting & throttling
- Mobile app (Flutter / React Native)

---

## 👨‍💻 Author

**Piyush Kumar**

- GitHub: https://github.com/Piyush-Kumar62
- LinkedIn: https://linkedin.com/in/your-linkedin

---
