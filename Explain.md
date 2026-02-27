# PROJECT NAME: Digital Cafe Ordering and Operations Platform

> **Complete Professional Documentation**
> Version: 1.0.0 | Java 21 | Spring Boot 3.5.10 | Angular 20 | MySQL

---

# TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Complete Tech Stack Explanation](#2-complete-tech-stack-explanation)
3. [Complete Project Folder Structure](#3-complete-project-folder-structure-explanation)
4. [Complete Backend Architecture](#4-complete-backend-architecture-explanation)
5. [Complete Request Flow](#5-complete-request-flow-explanation)
6. [Complete API Documentation](#6-complete-api-documentation)
7. [Database Complete Explanation](#7-database-complete-explanation)
8. [Entity Class Explanation](#8-entity-class-explanation)
9. [Repository Layer Explanation](#9-repository-layer-explanation)
10. [Service Layer Explanation](#10-service-layer-explanation)
11. [Controller Layer Explanation](#11-controller-layer-explanation)
12. [Spring Boot Annotations Full Explanation](#12-spring-boot-annotations-full-explanation)
13. [Security Explanation](#13-security-explanation)
14. [CORS Explanation](#14-cors-explanation)
15. [DTO Explanation](#15-dto-explanation)
16. [Configuration File Explanation](#16-configuration-file-explanation)
17. [Dependency Injection Explanation](#17-dependency-injection-explanation)
18. [Complete Project Flow Summary](#18-complete-project-flow-summary)
19. [Design Patterns Used](#19-design-patterns-used)
20. [Error Handling Explanation](#20-error-handling-explanation)
21. [README File](#21-readme-file)
22. [Interview Questions and Answers](#22-interview-questions-and-answers)
23. [Production-Level Improvements](#23-production-level-improvements)
24. [Project Explanation for Interview](#24-project-explanation-for-interview)
25. [Complete Visual Diagram Section](#25-complete-visual-diagram-section)

---

# 1. PROJECT OVERVIEW

## Simple Explanation (For Beginners)

Imagine you walk into a coffee shop. You sit at a table, look at the menu, order food, and pay the bill.

Now imagine doing ALL of that **on your phone or laptop** — booking a table before you arrive, browsing the menu online, placing your order digitally, and paying online. Meanwhile, the **chef** sees your order on their screen and starts cooking, and the **waiter** gets notified when food is ready to serve.

**That's exactly what this project does.** It's a complete digital system for running a cafe — from the customer's first click to the final payment.

## Technical Explanation

The **Digital Cafe Ordering and Operations Platform** is a full-stack, role-based, multi-tenant web application built with:
- **Backend**: Spring Boot 3.5.10 (Java 21) REST API with JWT authentication
- **Frontend**: Angular 20 SPA with PrimeNG component library
- **Database**: MySQL with JPA/Hibernate ORM

It implements a **5-role access control system** (Admin, Cafe Owner, Chef, Waiter, Customer) with complete workflows for:
- User registration with email verification and profile completion
- Multi-cafe management with menu, table, and staff management
- Table booking with conflict detection
- Order lifecycle management (Placed → Preparing → Ready → Served)
- Online payment processing via Razorpay integration
- Real-time notifications via WebSocket (STOMP protocol)

## Architecture Explanation

The system follows a **3-tier architecture**:

```
┌─────────────────────────────────────────────────────┐
│                 PRESENTATION TIER                    │
│          Angular 20 SPA (Port 4200)                 │
│    PrimeNG + Tailwind CSS + Chart.js                │
└────────────────────────┬────────────────────────────┘
                         │ HTTP / WebSocket
┌────────────────────────▼────────────────────────────┐
│                  APPLICATION TIER                    │
│          Spring Boot 3.5.10 (Port 8080)             │
│   REST Controllers + Services + Security (JWT)      │
└────────────────────────┬────────────────────────────┘
                         │ JDBC / JPA
┌────────────────────────▼────────────────────────────┐
│                    DATA TIER                         │
│               MySQL Database                        │
│          15+ Tables with Relationships              │
└─────────────────────────────────────────────────────┘
```

## What Problem It Solves

| Problem | Solution |
|---------|----------|
| Manual table booking via phone calls | Online booking with conflict detection |
| Paper-based order taking | Digital order placement by customers |
| Chef doesn't know order priority | Real-time order queue for chefs |
| Waiter doesn't know when food is ready | WebSocket push notification |
| Cash-only payments | Online Razorpay payment integration |
| No visibility into cafe operations | Admin & Owner dashboards with analytics |
| Managing multiple cafes is hard | Multi-cafe support under one platform |

## Who Uses It

| Role | What They Do |
|------|-------------|
| **ADMIN** | Manages the entire platform — creates cafe owners, approves users, views analytics |
| **CAFE_OWNER** | Manages their own cafe — menu items, tables, staff (chefs & waiters) |
| **CHEF** | Views incoming orders, marks them as PREPARING → READY |
| **WAITER** | Sees READY orders, serves food, marks as SERVED |
| **CUSTOMER** | Browses cafes, books tables, orders food, pays online, tracks orders |

## Type of Project

- **Type**: Full-Stack Web Application (Monorepo)
- **Architecture**: REST API + SPA (Single Page Application)
- **Authentication**: Stateless JWT-based
- **Deployment**: Suitable for cloud deployment (Docker-ready)

---

# 2. COMPLETE TECH STACK EXPLANATION

## Backend Technologies

### Java 21 (LTS)
- **What**: The core programming language
- **Why**: Industry-standard for enterprise applications; Java 21 offers virtual threads, pattern matching, and records
- **Where**: All backend source code under `digital-cafe-backend/src/main/java/`
- **Alternatives**: Kotlin, Go, Python (Django/FastAPI)
- **Best Practice**: Using LTS version ensures long-term support and stability

### Spring Boot 3.5.10
- **What**: An opinionated framework that simplifies Spring application development
- **Why**: Auto-configuration, embedded server, production-ready features out of the box
- **Where**: The entire backend — every controller, service, and config class
- **How It Works**: Uses `@SpringBootApplication` which combines `@Configuration`, `@EnableAutoConfiguration`, and `@ComponentScan`. Spring Boot scans for beans, auto-configures datasources, security, and web server
- **Alternatives**: Quarkus, Micronaut, Jakarta EE

### Spring Security + JWT
- **What**: Authentication and authorization framework with JSON Web Token support
- **Why**: Provides stateless authentication ideal for REST APIs and SPAs
- **Where**: `security/` package — `JwtUtil.java`, `JwtAuthenticationFilter.java`, `SecurityConfig.java`
- **How It Works**: On login, server generates a JWT containing user email + roles. Client sends JWT in `Authorization: Bearer <token>` header on every request. `JwtAuthenticationFilter` validates the token before reaching the controller
- **Alternatives**: OAuth2/OIDC, Session-based auth, Keycloak

### Spring Data JPA + Hibernate
- **What**: JPA is a specification for ORM; Hibernate is the implementation
- **Why**: Maps Java objects to database tables automatically; eliminates raw SQL
- **Where**: `entity/` (table mappings) and `repository/` (data access)
- **How It Works**: `@Entity` marks a class as a DB table. `JpaRepository<Entity, ID>` auto-generates CRUD queries. Hibernate translates method names like `findByEmail()` into `SELECT * FROM users WHERE email = ?`
- **Alternatives**: MyBatis, jOOQ, Spring JDBC

### MySQL
- **What**: Relational database management system
- **Why**: Reliable, widely supported, excellent for structured data with relationships
- **Where**: Configured in `application.properties` — `spring.datasource.url=jdbc:mysql://...`
- **Alternatives**: PostgreSQL, MariaDB, SQL Server

### Razorpay SDK
- **What**: Indian payment gateway SDK for online payments
- **Why**: Supports UPI, credit cards, debit cards, net banking — popular in India
- **Where**: `payment/` package — `PaymentService.java`, `RazorpayPaymentService.java`
- **How It Works**: 1) Backend creates a Razorpay order 2) Frontend shows payment widget 3) User pays 4) Backend verifies payment signature
- **Alternatives**: Stripe, PayU, Paytm

### MapStruct
- **What**: Compile-time code generator for type-safe bean mapping
- **Why**: Automatically maps Entity ↔ DTO without manual boilerplate
- **Where**: `mapper/` package — generates implementation at compile time
- **Alternatives**: ModelMapper, manual mapping, Dozer

### Lombok
- **What**: Annotation processor that generates boilerplate code
- **Why**: Eliminates getters, setters, constructors, builders — cleaner code
- **Where**: Every entity and DTO uses `@Getter`, `@Setter`, `@Builder`, `@NoArgsConstructor`
- **Annotations Used**: `@Data`, `@Builder`, `@RequiredArgsConstructor`, `@Slf4j`

### WebSocket (STOMP + SockJS)
- **What**: Full-duplex communication protocol for real-time updates
- **Why**: Pushes order status updates to chef/waiter dashboards instantly
- **Where**: `config/WebSocketConfig.java`, `websocket/` package
- **How It Works**: Client connects to `/ws` endpoint. Server broadcasts messages to `/topic/orders` or sends user-specific messages to `/queue/notifications`

### Spring Mail
- **What**: Email sending abstraction in Spring
- **Why**: Sends email verification links, password reset tokens, staff credentials
- **Where**: `service/impl/EmailServiceImpl.java`
- **Config**: SMTP via Gmail (`smtp.gmail.com:587`)

### SpringDoc OpenAPI (Swagger)
- **What**: Auto-generates API documentation from Spring controllers
- **Why**: Interactive API testing UI at `/swagger-ui.html`
- **Where**: `config/OpenAPIConfig.java`, available at `http://localhost:8080/swagger-ui.html`

### Spring Actuator
- **What**: Production-ready monitoring endpoints
- **Why**: Health checks, metrics, and info for DevOps monitoring
- **Where**: Exposed at `/actuator/health`, `/actuator/info`, `/actuator/metrics`

## Frontend Technologies

### Angular 20
- **What**: TypeScript-based SPA framework by Google
- **Why**: Component-based architecture, powerful routing, reactive forms, dependency injection
- **Where**: `digital-cafe-frontend/src/app/`
- **Key Features Used**: Standalone components, lazy loading, route guards, HTTP interceptors

### PrimeNG 20
- **What**: Rich UI component library for Angular
- **Why**: Pre-built components (tables, dialogs, charts, forms) accelerate development
- **Where**: Used across all dashboard and form components

### Tailwind CSS 3.4
- **What**: Utility-first CSS framework
- **Why**: Rapid styling with predefined utility classes
- **Where**: Configured in `tailwind.config.js`, used in component templates

### Chart.js + ng2-charts
- **What**: JavaScript charting library with Angular wrapper
- **Why**: Dashboard analytics visualizations (revenue charts, order trends)
- **Where**: Admin and Owner dashboard components

### STOMP.js + SockJS
- **What**: WebSocket client libraries
- **Why**: Real-time communication with the backend WebSocket server
- **Where**: `core/websocket/websocket.service.ts`

### RxJS
- **What**: Reactive Extensions library for asynchronous programming
- **Why**: Handles HTTP responses, WebSocket streams, and state management
- **Where**: Every service and component uses Observables

---

# 3. COMPLETE PROJECT FOLDER STRUCTURE EXPLANATION

```
Digital Cafe Ordering and Operations Platform/
├── digital-cafe-backend/                 # Spring Boot Backend
│   ├── src/main/java/com/digitalcafe/
│   │   ├── DigitalCafeBackendApplication.java   # Entry point
│   │   ├── config/                       # Configuration classes
│   │   │   ├── SecurityConfig.java       # Spring Security + CORS + JWT filter chain
│   │   │   ├── WebSocketConfig.java      # STOMP WebSocket configuration
│   │   │   ├── DataInitializationConfig.java  # Seeds roles + admin user
│   │   │   ├── OpenAPIConfig.java        # Swagger/OpenAPI setup
│   │   │   └── OrderServiceConfig.java   # Order-related beans
│   │   ├── controller/                   # REST API endpoints (12 controllers)
│   │   │   ├── AuthController.java       # Login, Register, JWT, Password reset
│   │   │   ├── AdminController.java      # Admin dashboard & user management
│   │   │   ├── CafeController.java       # CRUD for cafes
│   │   │   ├── MenuItemController.java   # CRUD for menu items
│   │   │   ├── TableController.java      # CRUD for cafe tables
│   │   │   ├── BookingController.java    # Table booking management
│   │   │   ├── OrderController.java      # Order lifecycle management
│   │   │   ├── PaymentController.java    # Payment initiation & verification
│   │   │   ├── ProfileController.java    # User profile CRUD
│   │   │   ├── StaffController.java      # Chef & Waiter management
│   │   │   ├── MenuController.java       # Public menu browsing
│   │   │   └── HealthController.java     # Health check endpoint
│   │   ├── service/                      # Business logic interfaces
│   │   │   ├── AuthService.java
│   │   │   ├── OrderService.java
│   │   │   ├── BookingService.java
│   │   │   ├── CafeService.java
│   │   │   ├── MenuItemService.java
│   │   │   ├── TableService.java
│   │   │   ├── ProfileService.java
│   │   │   ├── UserService.java
│   │   │   ├── EmailService.java
│   │   │   ├── DocumentStorageService.java
│   │   │   ├── AdminDashboardService.java
│   │   │   └── impl/                     # Service implementations
│   │   │       ├── AuthServiceImpl.java
│   │   │       ├── OrderServiceImpl.java
│   │   │       ├── BookingServiceImpl.java
│   │   │       └── ... (10 implementations)
│   │   ├── repository/                   # Data access layer (15 repos)
│   │   │   ├── UserRepository.java
│   │   │   ├── RoleRepository.java
│   │   │   ├── CafeRepository.java
│   │   │   ├── MenuItemRepository.java
│   │   │   ├── OrderRepository.java
│   │   │   ├── BookingRepository.java
│   │   │   ├── PaymentRepository.java
│   │   │   ├── ProfileRepository.java
│   │   │   └── ... (7 more)
│   │   ├── entity/                       # JPA entities (16 entities)
│   │   │   ├── BaseEntity.java           # Audit fields (createdAt, updatedAt)
│   │   │   ├── User.java                 # Core user with roles
│   │   │   ├── Role.java                 # ADMIN, CAFE_OWNER, CHEF, WAITER, CUSTOMER
│   │   │   ├── Profile.java             # Personal info, academic, work exp
│   │   │   ├── Address.java             # User address
│   │   │   ├── AcademicInfo.java        # Education records
│   │   │   ├── WorkExperience.java      # Job history
│   │   │   ├── Cafe.java                # Cafe establishment
│   │   │   ├── CafeTable.java           # Individual tables
│   │   │   ├── MenuItem.java            # Food/beverage items
│   │   │   ├── Booking.java             # Table reservations
│   │   │   ├── Order.java               # Food orders
│   │   │   ├── OrderItem.java           # Individual items in order
│   │   │   ├── Payment.java             # Payment records
│   │   │   ├── EmailVerificationToken.java
│   │   │   └── PasswordResetToken.java
│   │   ├── dto/                          # Data Transfer Objects (50+ DTOs)
│   │   │   ├── request/                  # Incoming request DTOs
│   │   │   └── response/                 # Outgoing response DTOs
│   │   ├── security/                     # JWT security components
│   │   │   ├── JwtUtil.java              # Token generation & validation
│   │   │   ├── JwtAuthenticationFilter.java  # Request filter
│   │   │   ├── CustomUserDetailsService.java # Loads user from DB
│   │   │   └── JwtAuthenticationEntryPoint.java  # 401 handler
│   │   ├── exception/                    # Error handling (8 classes)
│   │   │   ├── GlobalExceptionHandler.java    # @RestControllerAdvice
│   │   │   ├── ResourceNotFoundException.java
│   │   │   ├── BadRequestException.java
│   │   │   ├── AccessDeniedException.java
│   │   │   ├── AuthenticationException.java
│   │   │   ├── BusinessException.java
│   │   │   ├── ValidationException.java
│   │   │   └── ErrorResponse.java
│   │   ├── mapper/                       # MapStruct mappers
│   │   ├── payment/                      # Payment gateway integration
│   │   ├── util/                         # Utility classes
│   │   └── websocket/                    # WebSocket handlers
│   ├── src/main/resources/
│   │   ├── application.properties        # All configuration
│   │   └── sample-data.sql               # Sample data
│   ├── .env                              # Environment variables
│   └── pom.xml                           # Maven dependencies
│
├── digital-cafe-frontend/                # Angular Frontend
│   ├── src/app/
│   │   ├── app.routes.ts                 # All route definitions
│   │   ├── app.config.ts                 # App-level providers
│   │   ├── core/                         # Singleton services & guards
│   │   │   ├── auth/auth.service.ts      # Auth state management
│   │   │   ├── guards/                   # Route protection
│   │   │   │   ├── auth.guard.ts         # Is user logged in?
│   │   │   │   ├── role.guard.ts         # Does user have required role?
│   │   │   │   ├── email-verification.guard.ts
│   │   │   │   └── profile-completion.guard.ts
│   │   │   ├── interceptors/auth.interceptor.ts  # Adds JWT to requests
│   │   │   ├── services/
│   │   │   │   ├── api.service.ts        # HTTP client wrapper
│   │   │   │   ├── loading.service.ts
│   │   │   │   └── notification.service.ts
│   │   │   └── websocket/websocket.service.ts
│   │   ├── features/                     # Feature modules (lazy-loaded)
│   │   │   ├── landing/                  # Home page
│   │   │   ├── auth/                     # Login, Register, Verify, Reset
│   │   │   ├── admin/                    # Admin dashboard & management
│   │   │   ├── cafe-owner/               # Owner dashboard & management
│   │   │   ├── chef/                     # Chef order queue
│   │   │   ├── waiter/                   # Waiter service queue
│   │   │   ├── customer/                 # Customer menu, booking, orders
│   │   │   ├── about/                    # About page
│   │   │   ├── contact/                  # Contact page
│   │   │   └── legal/                    # Terms & Privacy
│   │   └── shared/                       # Shared models & components
│   ├── tailwind.config.js
│   ├── angular.json
│   └── package.json
│
├── README.md
└── .gitignore
```

### How Folders Connect (Flow)

```
Controller (receives HTTP request)
     │
     ▼ calls
Service Interface (defines business contract)
     │
     ▼ implemented by
Service Impl (contains business logic)
     │
     ▼ calls
Repository (JPA interface for DB queries)
     │
     ▼ uses
Entity (Java class mapped to DB table)
     │
     ▼ maps to
Database Table (MySQL)
```

---

# 4. COMPLETE BACKEND ARCHITECTURE EXPLANATION

## Layered Architecture

This project follows the **Layered (N-Tier) Architecture** pattern with 4 distinct layers:

```
┌─────────────────────────────────────────────────┐
│            PRESENTATION LAYER                    │
│         (Controllers / REST Endpoints)           │
│  AuthController, OrderController, CafeController │
│  Handles: HTTP requests, validation, responses   │
├─────────────────────────────────────────────────┤
│             BUSINESS LAYER                       │
│           (Services / Business Logic)            │
│  AuthServiceImpl, OrderServiceImpl, etc.         │
│  Handles: Rules, calculations, workflows         │
├─────────────────────────────────────────────────┤
│            PERSISTENCE LAYER                     │
│       (Repositories / Data Access)               │
│  UserRepository, OrderRepository, etc.           │
│  Handles: Database queries via JPA               │
├─────────────────────────────────────────────────┤
│              DATA LAYER                          │
│         (Entities / Database Tables)             │
│  User, Order, Cafe, Booking, Payment, etc.       │
│  Handles: Data structure and relationships       │
└─────────────────────────────────────────────────┘
```

### Why Each Layer Exists

| Layer | Purpose | Benefit |
|-------|---------|---------|
| **Controller** | Receives HTTP requests, delegates to service | Separation of HTTP concerns from business logic |
| **Service** | Contains all business rules and validations | Can be reused across multiple controllers |
| **Repository** | Abstracts database operations | Switch databases without changing business logic |
| **Entity** | Maps Java classes to database tables | Type-safe database interaction via ORM |

### Cross-Cutting Concerns

```
┌──────────────────────────────────────────────────┐
│                SECURITY LAYER                     │
│  JwtAuthenticationFilter → Every Request          │
│  @PreAuthorize → Method-level access control      │
├──────────────────────────────────────────────────┤
│             EXCEPTION HANDLING                    │
│  GlobalExceptionHandler → @RestControllerAdvice   │
│  Catches all exceptions → Standardized response   │
├──────────────────────────────────────────────────┤
│                DTO MAPPING                        │
│  MapStruct Mappers → Entity ↔ DTO conversion      │
│  Prevents exposing internal entity structure      │
└──────────────────────────────────────────────────┘
```

---

# 5. COMPLETE REQUEST FLOW EXPLANATION

## Example: Customer Places an Order

### Step-by-Step Flow

```
 ┌──────────┐     HTTP POST /api/orders      ┌──────────────────┐
 │ Customer │ ─────────────────────────────▶ │ JwtAuthFilter     │
 │ Browser  │   Authorization: Bearer JWT    │ (validates token) │
 └──────────┘                                └────────┬─────────┘
                                                      │ valid
                                              ┌───────▼──────────┐
                                              │ SecurityConfig    │
                                              │ @PreAuthorize     │
                                              │ hasRole(CUSTOMER) │
                                              └───────┬──────────┘
                                                      │ authorized
                                              ┌───────▼──────────┐
                                              │ OrderController   │
                                              │ createOrder()     │
                                              └───────┬──────────┘
                                                      │ calls
                                              ┌───────▼──────────┐
                                              │ OrderServiceImpl  │
                                              │ - validates booking│
                                              │ - creates order   │
                                              │ - calculates total│
                                              └───────┬──────────┘
                                                      │ calls
                                              ┌───────▼──────────┐
                                              │ OrderRepository   │
                                              │ save(order)       │
                                              └───────┬──────────┘
                                                      │ JPA/Hibernate
                                              ┌───────▼──────────┐
                                              │   MySQL Database  │
                                              │ INSERT INTO orders│
                                              └───────┬──────────┘
                                                      │ success
                                              ┌───────▼──────────┐
                                              │ MapStruct Mapper  │
                                              │ Entity→DTO        │
                                              └───────┬──────────┘
                                                      │
                                              ┌───────▼──────────┐
                                              │ ResponseEntity    │
                                              │ 201 CREATED       │
                                              │ { orderNumber,    │
                                              │   totalAmount,    │
                                              │   status: PLACED }│
                                              └───────┬──────────┘
                                                      │
 ┌──────────┐     JSON Response              ┌───────▼──────────┐
 │ Customer │ ◀───────────────────────────── │ Angular Frontend  │
 │ Browser  │  Shows "Order Placed!" toast   │ OrderTracking     │
 └──────────┘                                └──────────────────┘
```

### Sequence Diagram (ASCII)

```
Customer    Frontend    AuthFilter    Controller    Service    Repository    Database
   │           │            │             │           │            │            │
   │──click──▶│            │             │           │            │            │
   │           │──POST────▶│             │           │            │            │
   │           │            │──validate──▶│           │            │            │
   │           │            │   JWT OK    │           │            │            │
   │           │            │             │──call───▶│            │            │
   │           │            │             │           │──query───▶│            │
   │           │            │             │           │            │──SELECT──▶│
   │           │            │             │           │            │◀──data────│
   │           │            │             │           │◀──entity──│            │
   │           │            │             │           │──save────▶│            │
   │           │            │             │           │            │──INSERT──▶│
   │           │            │             │           │            │◀──ok──────│
   │           │            │             │◀──DTO────│            │            │
   │           │◀──JSON────│             │           │            │            │
   │◀──render─│            │             │           │            │            │
```

---

# 6. COMPLETE API DOCUMENTATION

## Auth APIs (`/api/auth`)

| # | Method | URL | Purpose | Auth Required | Body |
|---|--------|-----|---------|---------------|------|
| 1 | POST | `/api/auth/simple-register` | Quick registration (email + password) | No | `{ username, email, password }` |
| 2 | POST | `/api/auth/register` | Full registration with profile data | No | `{ username, email, password, firstName, lastName, ... }` |
| 3 | POST | `/api/auth/register-with-id` | Registration with govt ID upload | No | Multipart: payload JSON + govtIdProof file |
| 4 | POST | `/api/auth/login` | User login → returns JWT | No | `{ email, password }` |
| 5 | GET | `/api/auth/verify-email?token=` | Email verification | No | Query param: token |
| 6 | POST | `/api/auth/resend-verification?email=` | Resend verification email | No | Query param: email |
| 7 | POST | `/api/auth/forgot-password?email=` | Send password reset link | No | Query param: email |
| 8 | POST | `/api/auth/reset-password?token=` | Reset password with token | No | `{ newPassword }` |
| 9 | POST | `/api/auth/change-password` | Change password (logged in) | Yes | `{ oldPassword, newPassword }` |
| 10 | POST | `/api/auth/refresh-token?refreshToken=` | Get new access token | No | Query param: refreshToken |
| 11 | POST | `/api/auth/logout` | Logout (clears context) | Yes | — |
| 12 | GET | `/api/auth/me` | Get current user info | Yes | — |

## Admin APIs (`/api/admin`) — ADMIN only

| # | Method | URL | Purpose |
|---|--------|-----|---------|
| 1 | GET | `/api/admin/dashboard/stats` | Dashboard statistics |
| 2 | POST | `/api/admin/cafe-owners` | Create a cafe owner account |
| 3 | GET | `/api/admin/users` | List all users (paginated) |
| 4 | GET | `/api/admin/users/{id}` | Get user by ID |
| 5 | GET | `/api/admin/users/role/{roleName}` | Filter users by role |
| 6 | GET | `/api/admin/pending-users` | Get pending approval users |
| 7 | PUT | `/api/admin/approve/{userId}` | Approve user registration |
| 8 | PUT | `/api/admin/reject/{userId}` | Reject user registration |
| 9 | PATCH | `/api/admin/users/{id}/activate` | Activate user |
| 10 | PATCH | `/api/admin/users/{id}/deactivate` | Deactivate user |
| 11 | DELETE | `/api/admin/users/{id}` | Delete user |

## Cafe APIs (`/api/cafes`)

| # | Method | URL | Purpose | Role |
|---|--------|-----|---------|------|
| 1 | POST | `/api/cafes/owner/{ownerId}` | Create cafe | ADMIN |
| 2 | PUT | `/api/cafes/{cafeId}` | Update cafe | ADMIN, CAFE_OWNER |
| 3 | GET | `/api/cafes/{cafeId}` | Get cafe by ID | Public |
| 4 | GET | `/api/cafes/active` | Get active cafes | Public |
| 5 | GET | `/api/cafes` | List all cafes (paginated) | Public |
| 6 | GET | `/api/cafes/owner/{ownerId}` | Get owner's cafes | ADMIN, CAFE_OWNER |
| 7 | DELETE | `/api/cafes/{cafeId}` | Delete cafe | ADMIN |
| 8 | PATCH | `/api/cafes/{cafeId}/status` | Toggle active/inactive | ADMIN, CAFE_OWNER |

## Order APIs (`/api/orders`)

| # | Method | URL | Purpose | Role |
|---|--------|-----|---------|------|
| 1 | POST | `/api/orders` | Create order | CUSTOMER |
| 2 | GET | `/api/orders/{orderId}` | Get order by ID | All roles |
| 3 | GET | `/api/orders` | Get all orders | ADMIN, CAFE_OWNER |
| 4 | GET | `/api/orders/my-orders` | Get my orders | CUSTOMER |
| 5 | GET | `/api/orders/cafe/{cafeId}` | Orders by cafe (paginated) | Staff roles |
| 6 | GET | `/api/orders/cafe/{cafeId}/status/{status}` | Filter by status | Staff roles |
| 7 | GET | `/api/orders/chef/pending` | Pending orders for chef | CHEF |
| 8 | GET | `/api/orders/waiter/ready` | Ready orders for waiter | WAITER |
| 9 | PATCH | `/api/orders/{orderId}/status` | Update status | ADMIN, CHEF, WAITER |
| 10 | PUT | `/api/orders/{orderId}/prepare` | Mark as PREPARING | CHEF |
| 11 | PUT | `/api/orders/{orderId}/ready` | Mark as READY | CHEF |
| 12 | PUT | `/api/orders/{orderId}/served` | Mark as SERVED | WAITER |
| 13 | PATCH | `/api/orders/{orderId}/cancel` | Cancel order | CUSTOMER |

## Booking, Menu, Table, Payment, Profile, Staff APIs

Similar CRUD patterns exist for:
- **Bookings** (`/api/bookings`) — 11 endpoints
- **Menu Items** (`/api/menu-items`) — 8 endpoints
- **Tables** (`/api/tables`) — 9 endpoints
- **Payments** (`/api/payments`) — 5 endpoints
- **Profiles** (`/api/profiles`) — 6 endpoints
- **Staff** (`/api/staff`) — 7 endpoints

**Total: 80+ REST API endpoints**

---

# 7. DATABASE COMPLETE EXPLANATION

## ER Diagram (ASCII)

```
                            ┌──────────────┐
                     ┌──────│    roles     │
                     │      │──────────────│
                     │      │ id (PK)      │
                     │      │ name         │
                     │      │ description  │
                     │      └──────────────┘
                     │ M:N (user_roles)
                     │
┌──────────────────────────────────────────────────────┐
│                       users                           │
│──────────────────────────────────────────────────────│
│ id (PK) | username | email | password | is_active    │
│ is_email_verified | is_profile_complete | cafe_id(FK) │
│ created_by_user_id(FK) | registration_status         │
└───────┬──────────┬───────────┬───────────────────────┘
        │          │           │
        │1:1       │1:N        │M:1
        ▼          ▼           ▼
┌─────────────┐ ┌────────┐ ┌─────────────┐
│  profiles   │ │bookings│ │   cafes     │
│─────────────│ │────────│ │─────────────│
│ id (PK)     │ │ id(PK) │ │ id (PK)     │
│ user_id(FK) │ │cust(FK)│ │ name        │
│ first_name  │ │cafe(FK)│ │ owner_id(FK)│
│ last_name   │ │table(FK│ │ address     │
│ dob, gender │ │ date   │ │ phone       │
│ phone       │ │ time   │ │ rating      │
└──┬──────┬───┘ │ status │ └──┬─────┬────┘
   │1:1   │1:N  └───┬────┘    │1:N  │1:N
   ▼      ▼         │1:1      ▼     ▼
┌──────┐┌────────┐  │   ┌─────────┐┌──────────┐
│addrs ││academic│  │   │cafe_    ││menu_items│
│      ││_info   │  │   │tables   ││          │
└──────┘└────────┘  │   └─────────┘└────┬─────┘
                    ▼                    │
              ┌──────────┐              │
              │  orders  │              │
              │──────────│              │
              │ id (PK)  │              │
              │booking(FK│   ┌──────────▼──────┐
              │cust(FK)  │   │  order_items    │
              │cafe(FK)  │   │─────────────────│
              │ subtotal │   │ id (PK)         │
              │ tax      │   │ order_id (FK)   │
              │ total    │   │ menu_item_id(FK)│
              │ status   │   │ quantity        │
              └────┬─────┘   │ unit_price      │
                   │1:1      │ total_price     │
                   ▼         └─────────────────┘
              ┌──────────┐
              │ payments │
              │──────────│
              │ id (PK)  │
              │order(FK) │
              │ amount   │
              │ status   │
              │ razorpay │
              └──────────┘
```

## All Database Tables

| # | Table | Primary Key | Key Foreign Keys | Purpose |
|---|-------|-------------|------------------|---------|
| 1 | `users` | id | cafe_id, created_by_user_id | All system users |
| 2 | `roles` | id | — | Role definitions (5 roles) |
| 3 | `user_roles` | — | user_id, role_id | Many-to-many join table |
| 4 | `profiles` | id | user_id | Personal information |
| 5 | `addresses` | id | profile_id | User addresses |
| 6 | `academic_info` | id | profile_id | Education records |
| 7 | `work_experiences` | id | profile_id | Job history |
| 8 | `cafes` | id | owner_id | Cafe establishments |
| 9 | `cafe_tables` | id | cafe_id | Individual tables per cafe |
| 10 | `menu_items` | id | cafe_id | Food/beverage items |
| 11 | `bookings` | id | customer_id, cafe_id, table_id | Table reservations |
| 12 | `orders` | id | booking_id, customer_id, cafe_id | Food orders |
| 13 | `order_items` | id | order_id, menu_item_id | Items within an order |
| 14 | `payments` | id | order_id | Payment records |
| 15 | `email_verification_tokens` | id | user_id | Email verification |
| 16 | `password_reset_tokens` | id | user_id | Password reset flow |

## Key Relationships

- **User ↔ Role**: Many-to-Many (one user can have multiple roles)
- **User ↔ Profile**: One-to-One (each user has exactly one profile)
- **User ↔ Cafe**: Many-to-One (staff belongs to one cafe)
- **Cafe ↔ CafeTable**: One-to-Many (cafe has many tables)
- **Cafe ↔ MenuItem**: One-to-Many (cafe has many menu items)
- **Booking ↔ Order**: One-to-One (each booking can have one order)
- **Order ↔ OrderItem**: One-to-Many (order contains many items)
- **Order ↔ Payment**: One-to-One (each order has one payment)
- **Profile ↔ Address**: One-to-One
- **Profile ↔ AcademicInfo**: One-to-Many
- **Profile ↔ WorkExperience**: One-to-Many

---

# 8. ENTITY CLASS EXPLANATION

## BaseEntity — The Foundation

Every entity extends `BaseEntity`, which provides **automatic auditing**:

```java
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class BaseEntity {
    @CreatedDate
    private LocalDateTime createdAt;    // Auto-set when created

    @LastModifiedDate
    private LocalDateTime updatedAt;    // Auto-set when modified

    @CreatedBy
    private String createdBy;           // Who created this record

    @LastModifiedBy
    private String updatedBy;           // Who last modified it
}
```

**Why**: Every record in the database automatically tracks when and by whom it was created/modified. This is crucial for auditing in production systems.

## User Entity — Core of the System

```java
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_username", columnList = "username"),
    @Index(name = "idx_email", columnList = "email")
})
public class User extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    private String password;         // BCrypt hashed
    private Boolean isActive;        // Account enabled/disabled
    private Boolean isEmailVerified; // Email confirmed?
    private Boolean isProfileComplete; // Profile filled?

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "user_roles", ...)
    private Set<Role> roles;         // ADMIN, CUSTOMER, etc.

    @OneToOne(mappedBy = "user")
    private Profile profile;         // Personal info

    @ManyToOne
    private Cafe cafe;               // For staff: which cafe they belong to
}
```

### Annotation Explanations

| Annotation | What It Does | Simple Explanation |
|-----------|-------------|-------------------|
| `@Entity` | Marks class as a JPA entity | "This class = a database table" |
| `@Table(name="users")` | Specifies table name | "Save data in the 'users' table" |
| `@Id` | Marks the primary key | "This field uniquely identifies each row" |
| `@GeneratedValue(IDENTITY)` | Auto-increment ID | "Database generates the ID automatically" |
| `@Column(nullable=false, unique=true)` | Column constraints | "This field is required and unique" |
| `@ManyToMany` | Many-to-many relationship | "One user can have many roles, one role can have many users" |
| `@OneToOne(mappedBy)` | One-to-one relationship | "This user has exactly one profile" |
| `@ManyToOne(fetch=LAZY)` | Many-to-one relationship | "Many users can belong to one cafe; load cafe data only when needed" |
| `@Builder.Default` | Lombok default value | "If not specified, use this default" |
| `@Index` | Database index | "Speed up queries on this column" |

## Order Entity — The Workflow Engine

The Order entity is special because it implements a **state machine**:

```
PLACED ──▶ PREPARING ──▶ READY ──▶ SERVED
  │                                   
  └──▶ CANCELLED (at any point before SERVED)
```

Key methods in the entity:
- `markAsPreparing(chef)` — Chef starts cooking
- `markAsReady()` — Food is ready
- `markAsServed(waiter)` — Waiter serves the food
- `cancel(reason)` — Order is cancelled
- `calculateTotal()` — Sums up all order items + 5% tax - discount

## Payment Entity — Financial Tracking

Tracks the complete payment lifecycle with Razorpay:
- `PaymentStatus`: PENDING → PROCESSING → COMPLETED / FAILED / REFUNDED
- `PaymentMethod`: CREDIT_CARD, DEBIT_CARD, UPI, NET_BANKING, WALLET
- Stores `paymentGatewayOrderId` and `paymentGatewayPaymentId` for Razorpay reconciliation

---

# 9. REPOSITORY LAYER EXPLANATION

## What Is a Repository?

A **repository** is an interface that provides database operations without writing SQL. Spring Data JPA automatically generates the implementation at runtime.

```java
public interface UserRepository extends JpaRepository<User, Long> {
    // Spring automatically generates: SELECT * FROM users WHERE email = ?
    Optional<User> findByEmail(String email);

    // Spring generates: SELECT * FROM users WHERE username = ?
    Optional<User> findByUsername(String username);

    // Custom check: SELECT COUNT(*) FROM users WHERE email = ?
    Boolean existsByEmail(String email);
}
```

### How Method Name → SQL Query Works

| Repository Method | Generated SQL |
|-------------------|---------------|
| `findByEmail(String email)` | `SELECT * FROM users WHERE email = ?` |
| `findByIsActiveTrue()` | `SELECT * FROM users WHERE is_active = true` |
| `findByCafeIdAndStatus(Long id, String s)` | `SELECT * FROM orders WHERE cafe_id = ? AND status = ?` |
| `existsByEmail(String email)` | `SELECT COUNT(*) > 0 FROM users WHERE email = ?` |
| `countByCafeId(Long cafeId)` | `SELECT COUNT(*) FROM orders WHERE cafe_id = ?` |
| `deleteById(Long id)` | `DELETE FROM users WHERE id = ?` |

## All Repositories in This Project

| # | Repository | Entity | Key Custom Methods |
|---|-----------|--------|-------------------|
| 1 | `UserRepository` | User | `findByEmail()`, `findByUsername()`, `existsByEmail()` |
| 2 | `RoleRepository` | Role | `findByName(RoleName)` |
| 3 | `ProfileRepository` | Profile | `findByUserId()`, `existsByUserId()` |
| 4 | `CafeRepository` | Cafe | `findByOwnerId()`, `findByIsActiveTrue()` |
| 5 | `CafeTableRepository` | CafeTable | `findByCafeId()`, `findByCafeIdAndIsAvailableTrue()` |
| 6 | `MenuItemRepository` | MenuItem | `findByCafeId()`, `findByIsAvailableTrue()` |
| 7 | `BookingRepository` | Booking | `findByCustomerId()`, `findByCafeId()`, `findByStatus()` |
| 8 | `OrderRepository` | Order | `findByCustomerId()`, `findByCafeId()`, `findByStatus()` |
| 9 | `OrderItemRepository` | OrderItem | `findByOrderId()` |
| 10 | `PaymentRepository` | Payment | `findByOrderId()`, `findByPaymentGatewayOrderId()` |
| 11 | `EmailVerificationTokenRepository` | EmailVerificationToken | `findByToken()`, `findByUserId()` |
| 12 | `PasswordResetTokenRepository` | PasswordResetToken | `findByToken()`, `findByUserId()` |
| 13 | `AddressRepository` | Address | `findByProfileId()` |
| 14 | `AcademicInfoRepository` | AcademicInfo | `findByProfileId()` |
| 15 | `WorkExperienceRepository` | WorkExperience | `findByProfileId()` |

### Why Interface-Only (No Implementation)?

Spring Data JPA uses **dynamic proxy pattern** at runtime. When you extend `JpaRepository<User, Long>`:
1. Spring creates a proxy class that implements CRUD methods
2. Parses method names (like `findByEmail`) into JPQL queries
3. Executes the queries against the database
4. Returns the results mapped to entity objects

You get **19 built-in methods for free** (save, findById, findAll, delete, count, etc.)

---

# 10. SERVICE LAYER EXPLANATION

## What Is the Service Layer?

The service layer contains **all business logic**. Controllers should NEVER contain business logic. This separation means:
- Business rules are reusable across controllers
- Easy to unit test without HTTP concerns
- Single Responsibility Principle compliance

## Interface + Implementation Pattern

Every service is defined as an **interface** with a separate **implementation**:

```java
// Interface — defines WHAT operations are available
public interface OrderService {
    OrderResponse createOrder(CreateOrderRequest request);
    OrderResponse getOrderById(Long orderId);
    void cancelOrder(Long orderId, String reason);
}

// Implementation — defines HOW operations work
@Service
@RequiredArgsConstructor
@Transactional
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final BookingRepository bookingRepository;
    private final MenuItemRepository menuItemRepository;

    @Override
    public OrderResponse createOrder(CreateOrderRequest request) {
        // 1. Validate booking exists and belongs to customer
        Booking booking = bookingRepository.findById(request.getBookingId())
            .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        // 2. Create order entity
        Order order = Order.builder()
            .orderNumber(generateOrderNumber())
            .customer(booking.getCustomer())
            .cafe(booking.getCafe())
            .booking(booking)
            .status(OrderStatus.PLACED)
            .build();

        // 3. Add items and calculate total
        for (OrderItemRequest itemReq : request.getItems()) {
            MenuItem menuItem = menuItemRepository.findById(itemReq.getMenuItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Menu item not found"));
            order.addItem(menuItem, itemReq.getQuantity(), itemReq.getSpecialInstructions());
        }
        order.calculateTotal();

        // 4. Save to database
        Order savedOrder = orderRepository.save(order);

        // 5. Convert to DTO and return
        return mapToResponse(savedOrder);
    }
}
```

### Why Interface + Implementation?

| Reason | Explanation |
|--------|-------------|
| **Loose Coupling** | Controller depends on interface, not implementation |
| **Testability** | Easy to mock the interface in unit tests |
| **Polymorphism** | Can swap implementations (e.g., payment gateway) |
| **Proxy Support** | Spring creates proxy for `@Transactional` support |

## All Services in This Project

| # | Service Interface | Implementation | Key Responsibilities |
|---|------------------|----------------|---------------------|
| 1 | `AuthService` | `AuthServiceImpl` | Registration (3 types), login, JWT refresh, password reset, email verification |
| 2 | `UserService` | `UserServiceImpl` | User CRUD, role management, activation/deactivation, approval workflow |
| 3 | `CafeService` | `CafeServiceImpl` | Cafe CRUD, owner assignment, status toggle |
| 4 | `MenuItemService` | `MenuItemServiceImpl` | Menu item CRUD, availability toggle, cafe association |
| 5 | `TableService` | `TableServiceImpl` | Table CRUD, availability check by date/time |
| 6 | `BookingService` | `BookingServiceImpl` | Booking creation, conflict detection, status management |
| 7 | `OrderService` | `OrderServiceImpl` | Order lifecycle (PLACED→PREPARING→READY→SERVED), total calculation |
| 8 | `ProfileService` | `ProfileServiceImpl` | Profile CRUD, completion percentage, academic/work experience |
| 9 | `EmailService` | `EmailServiceImpl` | Email verification, password reset emails, staff credentials email |
| 10 | `DocumentStorageService` | `DocumentStorageServiceImpl` | Government ID file upload/storage |
| 11 | `AdminDashboardService` | `AdminDashboardServiceImpl` | Platform-wide statistics aggregation |

---

# 11. CONTROLLER LAYER EXPLANATION

## What Is a Controller?

A controller is the **entry point** for HTTP requests. It:
1. Receives the HTTP request
2. Extracts request body, path variables, query params
3. Calls the appropriate service method
4. Returns an HTTP response with proper status code

## Real Code Example — OrderController

```java
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<OrderResponse> createOrder(
            @Valid @RequestBody CreateOrderRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(orderService.createOrder(request, userDetails.getUsername()));
    }

    @GetMapping("/{orderId}")
    @PreAuthorize("hasAnyRole('ADMIN','CAFE_OWNER','CHEF','WAITER','CUSTOMER')")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable Long orderId) {
        return ResponseEntity.ok(orderService.getOrderById(orderId));
    }

    @PutMapping("/{orderId}/prepare")
    @PreAuthorize("hasRole('CHEF')")
    public ResponseEntity<OrderResponse> markAsPreparing(
            @PathVariable Long orderId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(orderService.markAsPreparing(orderId, userDetails.getUsername()));
    }
}
```

### Controller Layer Best Practices Used

| Practice | How Applied |
|----------|-------------|
| **Thin Controllers** | No business logic — only delegation to services |
| **Proper HTTP Status** | 201 for creation, 200 for success, 204 for no content |
| **Validation** | `@Valid` triggers DTO validation before service call |
| **Security** | `@PreAuthorize` enforces role check at method level |
| **REST Conventions** | GET for reading, POST for creating, PUT/PATCH for updating, DELETE for deleting |

---

# 12. SPRING BOOT ANNOTATIONS FULL EXPLANATION

## Core Annotations

| Annotation | Where Used | What It Does |
|-----------|-----------|-------------|
| `@SpringBootApplication` | Main class | Combines `@Configuration` + `@EnableAutoConfiguration` + `@ComponentScan` |
| `@RestController` | Controllers | Marks class as REST controller (combines `@Controller` + `@ResponseBody`) |
| `@Service` | Service impls | Marks class as business service bean |
| `@Repository` | Repositories | Marks class as data access bean (enables exception translation) |
| `@Component` | Utility classes | Generic Spring bean declaration |
| `@Configuration` | Config classes | Declares bean definitions via `@Bean` methods |

## Web Annotations

| Annotation | Where Used | What It Does |
|-----------|-----------|-------------|
| `@RequestMapping("/api/orders")` | Controller class | Base URL for all methods in this controller |
| `@GetMapping("/{id}")` | Controller method | Maps GET requests — used for reading data |
| `@PostMapping` | Controller method | Maps POST requests — used for creating data |
| `@PutMapping("/{id}")` | Controller method | Maps PUT requests — used for full updates |
| `@PatchMapping("/{id}/status")` | Controller method | Maps PATCH requests — used for partial updates |
| `@DeleteMapping("/{id}")` | Controller method | Maps DELETE requests — used for deletion |
| `@PathVariable` | Method param | Extracts value from URL path (e.g., `/orders/5` → id=5) |
| `@RequestBody` | Method param | Deserializes JSON body into Java object |
| `@RequestParam` | Method param | Extracts query parameter (?key=value) |
| `@Valid` | Method param | Triggers Bean Validation on the DTO |

## JPA Annotations

| Annotation | Where Used | What It Does |
|-----------|-----------|-------------|
| `@Entity` | Entity class | Maps class to database table |
| `@Table(name="")` | Entity class | Specifies custom table name |
| `@Id` | Entity field | Marks primary key field |
| `@GeneratedValue(IDENTITY)` | Entity field | Auto-increment primary key |
| `@Column(nullable, unique, length)` | Entity field | Column-level constraints |
| `@OneToOne` | Entity field | One-to-one relationship |
| `@OneToMany` | Entity field | One-to-many relationship (parent side) |
| `@ManyToOne` | Entity field | Many-to-one relationship (child side) |
| `@ManyToMany` | Entity field | Many-to-many (uses join table) |
| `@JoinColumn` | Entity field | Foreign key column specification |
| `@JoinTable` | Entity field | Join table for many-to-many |
| `@Enumerated(STRING)` | Entity field | Stores enum as string, not ordinal |
| `@MappedSuperclass` | Base entity | Shared fields inherited by child entities |
| `@CreatedDate` | BaseEntity | Auto-populates creation timestamp |
| `@LastModifiedDate` | BaseEntity | Auto-populates modification timestamp |

## Security Annotations

| Annotation | Where Used | What It Does |
|-----------|-----------|-------------|
| `@EnableWebSecurity` | SecurityConfig | Enables Spring Security |
| `@EnableMethodSecurity` | SecurityConfig | Enables `@PreAuthorize` annotations |
| `@PreAuthorize("hasRole('ADMIN')")` | Controller methods | Restricts access to specific roles |
| `@AuthenticationPrincipal` | Method param | Injects the currently logged-in user |

## Lombok Annotations

| Annotation | What It Generates |
|-----------|------------------|
| `@Getter` / `@Setter` | Getter and setter methods for all fields |
| `@NoArgsConstructor` | Empty constructor: `public User() {}` |
| `@AllArgsConstructor` | Constructor with all fields as parameters |
| `@RequiredArgsConstructor` | Constructor for `final` fields (used for DI) |
| `@Builder` | Builder pattern: `User.builder().name("X").build()` |
| `@Data` | Combines `@Getter` + `@Setter` + `@ToString` + `@EqualsAndHashCode` |
| `@Slf4j` | Creates `private static final Logger log = ...` |

---

# 13. SECURITY EXPLANATION

## Authentication Flow (JWT)

```
┌─────────────────── LOGIN FLOW ───────────────────────┐
│                                                       │
│  1. POST /api/auth/login { email, password }         │
│                    │                                  │
│                    ▼                                  │
│  2. AuthServiceImpl.login()                          │
│     ├── Find user by email                           │
│     ├── BCrypt.matches(password, hashedPassword)     │
│     ├── Check isActive, isEmailVerified              │
│     └── Generate JWT tokens                          │
│                    │                                  │
│                    ▼                                  │
│  3. JwtUtil.generateAccessToken(email, roles)        │
│     ├── Header: { alg: HS256, typ: JWT }             │
│     ├── Payload: { sub: email, roles: [...],         │
│     │              iat: now, exp: now+24h }           │
│     └── Signature: HMAC-SHA256(header.payload,       │
│                                secret)               │
│                    │                                  │
│                    ▼                                  │
│  4. Response: {                                      │
│       accessToken: "eyJhbG...",                       │
│       refreshToken: "eyJhbG...",                      │
│       user: { id, email, roles, ... }                │
│     }                                                 │
└──────────────────────────────────────────────────────┘

┌─────────── EVERY SUBSEQUENT REQUEST ─────────────────┐
│                                                       │
│  1. Client sends: Authorization: Bearer eyJhbG...    │
│                    │                                  │
│                    ▼                                  │
│  2. JwtAuthenticationFilter.doFilterInternal()        │
│     ├── Extract token from header                    │
│     ├── JwtUtil.extractUsername(token) → email        │
│     ├── Load user from DB via CustomUserDetailsService│
│     ├── JwtUtil.isTokenValid(token)                  │
│     ├── Check user.isActive()                        │
│     ├── If CUSTOMER: check email verified + profile  │
│     └── Set SecurityContextHolder.authentication     │
│                    │                                  │
│                    ▼                                  │
│  3. @PreAuthorize("hasRole('CUSTOMER')")             │
│     └── Checks if user's roles contain CUSTOMER     │
│                    │                                  │
│                    ▼                                  │
│  4. Controller method executes                       │
└──────────────────────────────────────────────────────┘
```

## Security Configuration (SecurityConfig.java)

```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) {
    http
        .csrf(csrf -> csrf.disable())           // Disabled: JWT is stateless
        .cors(cors -> cors.configurationSource(...)) // Allow frontend origin
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/auth/**").permitAll()   // Public: login, register
            .requestMatchers("/api/admin/**").hasRole("ADMIN")
            .requestMatchers("/api/owner/**").hasRole("CAFE_OWNER")
            .requestMatchers("/api/chef/**").hasRole("CHEF")
            .requestMatchers("/api/waiter/**").hasRole("WAITER")
            .requestMatchers("/api/customer/**").hasRole("CUSTOMER")
            .anyRequest().authenticated()
        )
        .sessionManagement(session -> session
            .sessionCreationPolicy(SessionCreationPolicy.STATELESS) // No sessions!
        )
        .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
}
```

## Password Storage

Passwords are **never stored in plain text**. The system uses BCrypt:

```
Input:  "Admin@123"
Stored: "$2a$10$N9qo8uLOickgx2ZMRZoHK..."  (60-char hash)
```

BCrypt automatically handles:
- Random salt generation (different hash each time)
- Slow hashing (resistant to brute force)
- Verification via `BCrypt.matches(rawPassword, hashedPassword)`

---

# 14. CORS EXPLANATION

## What Is CORS?

**Cross-Origin Resource Sharing** — a browser security mechanism that blocks requests from one origin to another.

**Problem**: Frontend runs on `http://localhost:4200`, backend on `http://localhost:8080`. Without CORS configuration, the browser blocks all API calls.

## How It's Configured

```java
@Bean
CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of(
        "http://localhost:4200",    // Angular dev server
        "http://localhost:3000"     // Alternate frontend
    ));
    config.setAllowedMethods(List.of("GET","POST","PUT","DELETE","PATCH","OPTIONS"));
    config.setAllowedHeaders(List.of("*"));
    config.setAllowCredentials(true);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);  // Apply to ALL endpoints
    return source;
}
```

### CORS Flow

```
Browser                             Backend (8080)
   │                                     │
   │─── Preflight OPTIONS request ─────▶│
   │   Origin: http://localhost:4200     │
   │                                     │
   │◀── 200 OK ────────────────────────│
   │   Access-Control-Allow-Origin:     │
   │   http://localhost:4200             │
   │                                     │
   │─── Actual POST /api/orders ────────▶│
   │   Origin: http://localhost:4200     │
   │◀── 201 Created + JSON ────────────│
```

---

# 15. DTO EXPLANATION

## What Is a DTO?

A **Data Transfer Object** (DTO) is a simple Java class used to transfer data between layers. It prevents exposing your database entity structure directly to the client.

### Why Not Send Entity Directly?

| Problem with Entities | DTO Solution |
|----------------------|-------------|
| Password field gets exposed | DTO excludes password |
| Circular references cause infinite JSON | DTO has flat structure |
| Changing DB schema breaks API contract | DTO provides stable API |
| Client sees internal IDs and metadata | DTO shows only needed fields |

### DTO Structure in This Project

```
dto/
├── request/                    # Data coming IN from client
│   ├── LoginRequest.java       # { email, password }
│   ├── RegisterRequest.java    # { username, email, password, ... }
│   ├── CreateOrderRequest.java # { bookingId, items: [...] }
│   ├── CreateBookingRequest.java
│   ├── CreateCafeRequest.java
│   ├── CreateMenuItemRequest.java
│   └── ... (20+ request DTOs)
│
└── response/                   # Data going OUT to client
    ├── AuthResponse.java       # { accessToken, refreshToken, user }
    ├── OrderResponse.java      # { orderId, orderNumber, items, total }
    ├── BookingResponse.java
    ├── CafeResponse.java
    ├── MenuItemResponse.java
    ├── UserResponse.java
    ├── DashboardStatsResponse.java
    └── ... (20+ response DTOs)
```

### Example DTO with Validation

```java
@Data
@Builder
public class CreateOrderRequest {
    @NotNull(message = "Booking ID is required")
    private Long bookingId;

    @NotEmpty(message = "Order must have at least one item")
    @Valid
    private List<OrderItemRequest> items;
}

@Data
public class OrderItemRequest {
    @NotNull(message = "Menu item ID is required")
    private Long menuItemId;

    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    private String specialInstructions;
}
```

When `@Valid` is used on the controller parameter, Spring automatically validates these constraints and returns a 400 error with field-level messages if validation fails.

---

# 16. CONFIGURATION FILE EXPLANATION

## application.properties — Complete Breakdown

### Database Configuration
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/digital_cafe_db
    ?createDatabaseIfNotExist=true  # Creates DB if missing
    &useSSL=false                   # No SSL for local dev
    &allowPublicKeyRetrieval=true   # Required for MySQL 8+
    &serverTimezone=UTC             # Consistent timezone

spring.datasource.username=${DB_USERNAME:root}    # Env var with default
spring.datasource.password=${DB_PASSWORD}          # MUST be set in env

spring.jpa.hibernate.ddl-auto=update              # Auto-create/update tables
spring.jpa.show-sql=false                         # Don't log SQL in production
spring.jpa.open-in-view=false                     # Best practice: prevent lazy loading in views
```

### JWT Configuration
```properties
jwt.secret=${JWT_SECRET}                          # HMAC signing key (env var)
jwt.expiration=86400000                           # 24 hours in milliseconds
jwt.refresh-expiration=604800000                  # 7 days in milliseconds
```

### Email Configuration
```properties
spring.mail.host=smtp.gmail.com                   # Gmail SMTP server
spring.mail.port=587                              # TLS port
spring.mail.username=${MAIL_USERNAME}              # Gmail address
spring.mail.password=${MAIL_APP_PASSWORD}          # Gmail App Password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

### Payment Gateway
```properties
payment.gateway=${PAYMENT_GATEWAY:TEST}           # TEST mode by default
razorpay.key.id=${RAZORPAY_KEY_ID:}               # Razorpay API key
razorpay.key.secret=${RAZORPAY_KEY_SECRET:}       # Razorpay secret
```

### Environment Variables Required

| Variable | Purpose | Example |
|----------|---------|---------|
| `DB_PASSWORD` | MySQL password | `MySecurePass123` |
| `JWT_SECRET` | Token signing key | `myVeryLongSecretKey256bitsOrMore` |
| `MAIL_USERNAME` | Gmail address | `cafe@gmail.com` |
| `MAIL_APP_PASSWORD` | Gmail app password | `abcd efgh ijkl mnop` |
| `RAZORPAY_KEY_ID` | Payment gateway key | `rzp_test_abc123` |
| `RAZORPAY_KEY_SECRET` | Payment gateway secret | `secret_xyz789` |

### Security Best Practice: Environment Variables

The project uses the `${ENV_VAR:default}` pattern:
- **Secrets** (passwords, keys) → No defaults, MUST be set as environment variables
- **Non-secrets** (ports, URLs) → Have safe defaults for development
- A `.env` file exists for local development but is gitignored

---

# 17. DEPENDENCY INJECTION EXPLANATION

## What Is Dependency Injection (DI)?

DI is a design pattern where an object's dependencies are **provided externally** rather than created internally.

### Without DI (Tight Coupling — BAD)
```java
public class OrderController {
    // Controller CREATES service — tightly coupled
    private OrderService orderService = new OrderServiceImpl();
}
```

### With DI (Loose Coupling — GOOD)
```java
@RestController
@RequiredArgsConstructor  // Lombok generates constructor
public class OrderController {
    private final OrderService orderService;  // Spring INJECTS this
}
```

## How Spring DI Works in This Project

```
1. @Component / @Service / @Repository / @Configuration
   ↓
2. Spring scans classpath at startup (via @ComponentScan)
   ↓
3. Creates singleton instances (beans) of annotated classes
   ↓
4. Resolves dependencies by type
   ↓
5. Injects via constructor (@RequiredArgsConstructor)
```

### DI Chain Example

```
OrderController
  └── needs OrderService (interface)
        └── Spring finds OrderServiceImpl (@Service)
              └── needs OrderRepository (interface)
                    └── Spring creates JPA proxy (extends JpaRepository)
                          └── needs DataSource
                                └── Spring auto-configures from application.properties
```

### Types of Injection Used

| Type | How | Used In This Project? |
|------|-----|----------------------|
| **Constructor Injection** | `@RequiredArgsConstructor` + `final` fields | ✅ Primary method (all controllers, services) |
| **Field Injection** | `@Autowired` on field | ❌ Not used (considered bad practice) |
| **Setter Injection** | `@Autowired` on setter method | ❌ Not used |

**Why Constructor Injection is preferred**: Fields are `final` (immutable), mandatory dependencies are enforced at compile time, and easier to test.

---

# 18. COMPLETE PROJECT FLOW SUMMARY

## End-to-End User Journey

### 1. Customer Registration → Order → Payment

```
┌─────────────────────────────────────────────────────────────┐
│                  CUSTOMER JOURNEY                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  STEP 1: Registration                                       │
│  POST /api/auth/simple-register                             │
│  → Creates user with CUSTOMER role                          │
│  → Sends email verification link                            │
│                                                              │
│  STEP 2: Email Verification                                 │
│  GET /api/auth/verify-email?token=abc123                    │
│  → Marks isEmailVerified = true                             │
│                                                              │
│  STEP 3: Complete Profile                                   │
│  PUT /api/profiles                                          │
│  → Fills name, phone, address                               │
│  → Marks isProfileComplete = true                           │
│  → NOW customer can access all features                     │
│                                                              │
│  STEP 4: Browse Cafes & Menu                                │
│  GET /api/cafes/active → List of active cafes               │
│  GET /api/menu-items/cafe/{cafeId} → Menu items             │
│                                                              │
│  STEP 5: Book a Table                                       │
│  POST /api/bookings → Reserve table for date/time           │
│  → Checks table availability                                │
│  → Status: PENDING → CONFIRMED                              │
│                                                              │
│  STEP 6: Place Order                                        │
│  POST /api/orders → Create order linked to booking          │
│  → Adds menu items with quantities                          │
│  → Calculates subtotal + tax = total                        │
│  → Status: PLACED                                           │
│                                                              │
│  STEP 7: Make Payment                                       │
│  POST /api/payments/initiate → Creates Razorpay order       │
│  → Frontend shows Razorpay widget                           │
│  → Customer pays via UPI/card                               │
│  POST /api/payments/verify → Verifies payment signature     │
│  → Payment status: COMPLETED                                │
│                                                              │
│  STEP 8: Track Order                                        │
│  GET /api/orders/{orderId} → Real-time status               │
│  WebSocket → Push notifications on status change            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2. Chef Workflow

```
┌─────────────────────────────────────────────┐
│             CHEF WORKFLOW                    │
├─────────────────────────────────────────────┤
│                                              │
│  1. Login → Chef Dashboard                  │
│  2. GET /api/orders/chef/pending             │
│     → See all PLACED orders for their cafe  │
│  3. PUT /api/orders/{id}/prepare             │
│     → Status: PLACED → PREPARING            │
│     → WebSocket notifies customer           │
│  4. PUT /api/orders/{id}/ready               │
│     → Status: PREPARING → READY             │
│     → WebSocket notifies waiter             │
│                                              │
└─────────────────────────────────────────────┘
```

### 3. Waiter Workflow

```
┌─────────────────────────────────────────────┐
│            WAITER WORKFLOW                   │
├─────────────────────────────────────────────┤
│                                              │
│  1. Login → Waiter Dashboard                │
│  2. GET /api/orders/waiter/ready             │
│     → See all READY orders for their cafe   │
│  3. PUT /api/orders/{id}/served              │
│     → Status: READY → SERVED                │
│     → WebSocket notifies customer           │
│                                              │
└─────────────────────────────────────────────┘
```

---

# 19. DESIGN PATTERNS USED

| # | Pattern | Where Used | Explanation |
|---|---------|-----------|-------------|
| 1 | **Repository Pattern** | All `*Repository` interfaces | Abstracts data access; controllers don't know about SQL |
| 2 | **Service Layer Pattern** | All `*Service` interfaces + `*ServiceImpl` classes | Encapsulates business logic separate from presentation |
| 3 | **DTO Pattern** | `dto/request/` and `dto/response/` | Decouples API contract from database schema |
| 4 | **Builder Pattern** | Entity creation via Lombok `@Builder` | Readable object construction: `User.builder().name("X").build()` |
| 5 | **Factory Method** | `DataInitializationConfig` creating initial roles/admin | Centralizes object creation logic |
| 6 | **Singleton Pattern** | All Spring beans (default scope) | One instance per bean in the application context |
| 7 | **Strategy Pattern** | Payment gateway — `PaymentService` interface with multiple implementations | Swap Razorpay/Test implementations without changing controller |
| 8 | **Observer Pattern** | WebSocket notifications | When order status changes, subscribed clients are notified |
| 9 | **Chain of Responsibility** | Spring Security filter chain | `JwtAuthenticationFilter` → `UsernamePasswordFilter` → `ExceptionTranslationFilter` |
| 10 | **Template Method** | `BaseEntity` with auditing fields | Common audit behavior inherited by all entities |
| 11 | **Proxy Pattern** | JPA repositories, `@Transactional` | Spring creates proxy classes for transaction management and JPA |
| 12 | **Facade Pattern** | Service layer facades complex operations | `OrderServiceImpl.createOrder()` coordinates booking, menu, and payment checks |
| 13 | **Dependency Injection** | `@RequiredArgsConstructor` + `final` fields everywhere | Inversion of Control — framework manages object lifecycle |
| 14 | **Interceptor Pattern** | `JwtAuthenticationFilter`, Angular `AuthInterceptor` | Intercepts requests to add/validate JWT tokens |

---

# 20. ERROR HANDLING EXPLANATION

## Global Exception Handler

The project uses `@RestControllerAdvice` to handle ALL exceptions in one place:

```java
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        return new ResponseEntity<>(
            new ErrorResponse(now(), 404, "Not Found", ex.getMessage(), path),
            HttpStatus.NOT_FOUND
        );
    }

    @ExceptionHandler(BadRequestException.class)
    // → 400 Bad Request

    @ExceptionHandler(ValidationException.class)
    // → 400 Validation Error

    @ExceptionHandler(AuthenticationException.class)
    // → 401 Authentication Failed

    @ExceptionHandler(AccessDeniedException.class)
    // → 403 Access Denied

    @ExceptionHandler(BusinessException.class)
    // → 422 Business Rule Violation

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    // → 413 Payload Too Large

    @ExceptionHandler(MethodArgumentNotValidException.class)
    // → 400 with field-level validation errors

    @ExceptionHandler(Exception.class)
    // → 500 Internal Server Error (catch-all)
}
```

## Standard Error Response Format

Every error returns a consistent JSON structure:

```json
{
    "timestamp": "2024-01-15T10:30:00",
    "status": 404,
    "error": "Not Found",
    "message": "Cafe with id 99 not found",
    "path": "/api/cafes/99"
}
```

## Exception Hierarchy

```
Exception (Java)
├── ResourceNotFoundException.java  → 404
├── BadRequestException.java        → 400
├── ValidationException.java        → 400
├── AuthenticationException.java    → 401
├── AccessDeniedException.java      → 403
├── BusinessException.java          → 422
└── [Spring exceptions]
    ├── MethodArgumentNotValidException → 400 (auto-validation)
    ├── BadCredentialsException         → 401 (wrong password)
    ├── MaxUploadSizeExceededException  → 413 (file too large)
    └── MethodArgumentTypeMismatchException → 400 (wrong param type)
```

---

# 21. README FILE

## How to Run This Project

### Prerequisites
- Java 21 (JDK)
- MySQL 8.0+
- Node.js 18+ and npm
- Maven 3.9+

### Backend Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-repo/digital-cafe-platform.git

# 2. Navigate to backend
cd digital-cafe-backend

# 3. Create .env file with required variables
# DB_PASSWORD=your_mysql_password
# JWT_SECRET=your_long_secret_key_at_least_256_bits
# MAIL_USERNAME=your_email@gmail.com
# MAIL_APP_PASSWORD=your_gmail_app_password

# 4. Create MySQL database (auto-created if using default URL)
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS digital_cafe_db;"

# 5. Run the application
./mvnw spring-boot:run

# Backend runs at http://localhost:8080
# Swagger UI at http://localhost:8080/swagger-ui.html
```

### Frontend Setup

```bash
# 1. Navigate to frontend
cd digital-cafe-frontend

# 2. Install dependencies
npm install

# 3. Start development server
ng serve

# Frontend runs at http://localhost:4200
```

### Default Admin Credentials

| Field | Value |
|-------|-------|
| Email | `admin@digitalcafe.com` |
| Password | `Admin@123` |
| Role | ADMIN |

These are created automatically by `DataInitializationConfig.java` on first startup.

---

# 22. INTERVIEW QUESTIONS AND ANSWERS

## Q1: What is this project about?
**A**: This is a full-stack cafe management platform where customers can browse cafes, book tables, order food online, and pay via Razorpay. It supports 5 roles — Admin, Cafe Owner, Chef, Waiter, and Customer — each with their own dashboard and permissions. Built with Spring Boot 3.5.10, Angular 20, and MySQL.

## Q2: Why did you choose Spring Boot for the backend?
**A**: Spring Boot provides auto-configuration, embedded Tomcat server, and a mature ecosystem for building REST APIs. It has excellent support for security (Spring Security), database access (Spring Data JPA), and real-time communication (WebSocket). The annotation-driven development model with `@RestController`, `@Service`, and `@Repository` enforces clean architecture. It's also the industry standard for enterprise Java applications.

## Q3: How does authentication work in your project?
**A**: We use stateless JWT (JSON Web Token) authentication:
1. User logs in with email/password → server validates credentials
2. Server generates an access token (24h) and refresh token (7d) using HMAC-SHA256
3. Client stores tokens and sends them in the `Authorization: Bearer <token>` header
4. `JwtAuthenticationFilter` intercepts every request, extracts and validates the token
5. If valid, it loads the user from the database and sets the `SecurityContext`
6. `@PreAuthorize` annotations on controller methods enforce role-based access

## Q4: How did you handle role-based access control?
**A**: Two layers of protection:
- **URL-level**: `SecurityConfig` maps URL patterns to roles (`/api/admin/**` → ADMIN only)
- **Method-level**: `@PreAuthorize("hasRole('CHEF')")` on individual controller methods
- **Roles stored as**: Many-to-many relationship between `users` and `roles` tables
- **Frontend**: Angular route guards (`authGuard`, `roleGuard`) prevent unauthorized navigation

## Q5: Explain the order lifecycle.
**A**: An order follows a state machine pattern:
```
PLACED → PREPARING → READY → SERVED
  └────→ CANCELLED (before SERVED)
```
- **Customer** creates order (PLACED) and can cancel it
- **Chef** marks it as PREPARING, then READY
- **Waiter** marks it as SERVED
- Each transition is a dedicated API endpoint with role-specific `@PreAuthorize`
- WebSocket notifications push status updates to relevant dashboards in real-time

## Q6: How does the payment integration work?
**A**: We integrate with Razorpay using a 3-step process:
1. **Initiation**: Backend creates a Razorpay order via their SDK → returns `orderId` to frontend
2. **Payment**: Frontend opens Razorpay checkout widget → customer pays via UPI/card
3. **Verification**: Frontend sends payment details to backend → backend verifies the signature using HMAC-SHA256 to prevent tampering → marks payment as COMPLETED

We use the **Strategy Pattern** — `PaymentService` interface allows swapping between `RazorpayPaymentService` and `TestPaymentService`.

## Q7: Why did you separate Request DTOs and Response DTOs?
**A**: Request and Response DTOs serve different purposes:
- **Request DTOs** include validation annotations (`@NotNull`, `@Min`, `@Email`) and only the fields a client should send
- **Response DTOs** include computed fields (like order total), formatted dates, and exclude sensitive data (like passwords)
- This pattern prevents accidental exposure of entity internals and provides a stable API contract

## Q8: How do you handle exceptions?
**A**: We use a centralized `GlobalExceptionHandler` with `@RestControllerAdvice` that catches all exceptions and returns a standardized `ErrorResponse` JSON with `timestamp`, `status`, `error`, `message`, and `path`. Custom exceptions like `ResourceNotFoundException` (404), `BusinessException` (422), and `AuthenticationException` (401) map to specific HTTP status codes.

## Q9: What design patterns did you use?
**A**: Key patterns include:
- **Repository Pattern** — Data access abstraction via Spring Data JPA
- **Service Layer Pattern** — Business logic separated from controllers
- **Strategy Pattern** — Payment gateway implementations (Razorpay/Test)
- **Builder Pattern** — Entity construction via Lombok `@Builder`
- **Observer Pattern** — WebSocket notifications on order status changes
- **Chain of Responsibility** — Spring Security filter chain
- **Proxy Pattern** — JPA repositories and `@Transactional` proxies
- **Interceptor Pattern** — JWT filter (backend) and HTTP interceptor (frontend)

## Q10: How does WebSocket work in your project?
**A**: We use STOMP protocol over WebSocket with SockJS fallback:
- **Server**: `WebSocketConfig` registers `/ws` endpoint with message broker prefixes `/topic` (broadcast) and `/queue` (user-specific)
- **Client**: Angular's WebSocket service connects to `/ws`, subscribes to channels like `/topic/orders/cafe/{cafeId}`
- **Use case**: When a chef marks an order as READY, the server sends a message to `/topic/orders` → the waiter's dashboard auto-updates

## Q11: How do you ensure data integrity?
**A**: Multiple layers:
- **Database constraints**: `@Column(nullable=false, unique=true)`, foreign keys
- **Bean Validation**: `@NotNull`, `@NotEmpty`, `@Min`, `@Email` on DTOs
- **Business validation**: Service layer checks (e.g., table availability before booking)
- **Transactions**: `@Transactional` ensures atomic operations (all succeed or all rollback)
- **Optimistic locking**: BaseEntity's `@Version` (if implemented) prevents concurrent modification

## Q12: What are the security measures in your application?
**A**: 
- **BCrypt password hashing** — passwords never stored in plain text
- **JWT with HMAC-SHA256 signing** — stateless, tamper-proof tokens
- **CSRF disabled** — appropriate for stateless APIs
- **CORS configured** — only allows requests from the frontend origin
- **Role-based access** — both URL-level and method-level authorization
- **Email verification** — prevents fake account creation
- **Profile completion enforcement** — customers must complete profile before ordering
- **Environment variables** — secrets never hardcoded in source code
- **Input validation** — all DTOs validated before processing
- **SQL injection prevention** — JPA parameterized queries
- **Global exception handler** — prevents stack trace leakage

---

# 23. PRODUCTION-LEVEL IMPROVEMENTS

## What Could Be Added for Production

| # | Improvement | Why | Implementation |
|---|------------|-----|----------------|
| 1 | **Rate Limiting** | Prevent API abuse/DDoS | Spring Cloud Gateway or Bucket4j |
| 2 | **Redis Caching** | Cache menu items, cafe details | `@Cacheable` with Redis |
| 3 | **Docker + Docker Compose** | Containerized deployment | `Dockerfile` + `docker-compose.yml` |
| 4 | **CI/CD Pipeline** | Automated testing & deployment | GitHub Actions + Docker Hub |
| 5 | **API Versioning** | Backward-compatible APIs | URL versioning (`/api/v1/`, `/api/v2/`) |
| 6 | **Pagination** | Handle large datasets efficiently | Already partial; add to all list endpoints |
| 7 | **Database Migration** | Version-controlled schema changes | Flyway or Liquibase (instead of `ddl-auto=update`) |
| 8 | **Centralized Logging** | Log aggregation & analysis | ELK Stack (Elasticsearch + Logstash + Kibana) |
| 9 | **Unit & Integration Tests** | Code quality assurance | JUnit 5 + Mockito + Testcontainers |
| 10 | **OAuth2 / SSO** | Third-party login (Google, GitHub) | Spring Security OAuth2 Client |
| 11 | **File Storage (S3)** | Cloud-based file storage | AWS S3 or MinIO instead of local filesystem |
| 12 | **Microservices** | Scalable architecture | Split into auth-service, order-service, payment-service |
| 13 | **Message Queue** | Async processing | RabbitMQ or Apache Kafka for order processing |
| 14 | **Monitoring ** | Application performance monitoring | Prometheus + Grafana + Micrometer |
| 15 | **HTTPS/SSL** | Encrypted communication | Let's Encrypt SSL certificate |
| 16 | **Database Read Replicas** | Scale reads | MySQL read replicas with Spring Data routing |

---

# 24. PROJECT EXPLANATION FOR INTERVIEW

## 2-Minute Elevator Pitch

> "I built a **Digital Cafe Ordering and Operations Platform** — a full-stack application using **Spring Boot** and **Angular** that digitizes the entire cafe experience.
>
> Customers can browse cafes, book tables, order food online, and pay via **Razorpay**. Chefs see incoming orders in real-time via **WebSocket** and mark them as ready. Waiters get notified when food is ready to serve.
>
> The system supports **5 roles** — Admin, Cafe Owner, Chef, Waiter, and Customer — each with their own dashboard and permissions.
>
> On the backend, I used **Spring Security with JWT** for stateless authentication, **Spring Data JPA** with MySQL for data persistence, and **MapStruct** for entity-DTO mapping. The API has **80+ endpoints** with role-based access control using `@PreAuthorize`.
>
> The frontend uses **Angular 20** with **PrimeNG** components, **Tailwind CSS**, and **lazy-loaded routes** with **4 route guards** for security.
>
> Key design decisions include a **layered architecture** (Controller → Service → Repository), **Strategy pattern** for swappable payment gateways, and centralized error handling with a `GlobalExceptionHandler`."

## Role-Wise Feature Summary

| Module | Features | Tech Used |
|--------|----------|-----------|
| **Authentication** | 3 registration types, email verification, password reset, JWT refresh | Spring Security, JWT, Spring Mail |
| **Admin Panel** | User management, cafe management, analytics dashboard | `@PreAuthorize`, Pageable, Chart.js |
| **Cafe Management** | CRUD for cafes, menus, tables, staff | JPA relationships, Cascade operations |
| **Booking System** | Table reservation with conflict detection | Date/time queries, availability checks |
| **Order System** | Order lifecycle with state machine transitions | Status enum, WebSocket notifications |
| **Payment** | Razorpay integration with signature verification | Razorpay SDK, HMAC-SHA256 |
| **Real-Time** | Live order status updates | STOMP WebSocket, SockJS |
| **Profile System** | Multi-section profile with completion tracking | OneToOne, OneToMany JPA mappings |

---

# 25. COMPLETE VISUAL DIAGRAM SECTION

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT TIER                               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Angular 20 SPA                          │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────────┐   │  │
│  │  │ Admin   │ │  Owner  │ │Customer │ │ Chef/Waiter  │   │  │
│  │  │Dashboard│ │Dashboard│ │Dashboard│ │  Dashboard   │   │  │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └──────┬───────┘   │  │
│  │       │           │           │              │            │  │
│  │  ┌────▼───────────▼───────────▼──────────────▼────────┐  │  │
│  │  │              Core Services Layer                    │  │  │
│  │  │  AuthService | ApiService | WebSocketService       │  │  │
│  │  │  AuthGuard | RoleGuard | AuthInterceptor           │  │  │
│  │  └────────────────────┬───────────────────────────────┘  │  │
│  └───────────────────────│───────────────────────────────────┘  │
│                          │ HTTP REST + WebSocket                 │
└──────────────────────────┼──────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                       SERVER TIER                                 │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                  Spring Boot 3.5.10                         │  │
│  │                                                            │  │
│  │  ┌──────────┐  ┌─────────────────────────────────────┐    │  │
│  │  │ Security │  │         REST Controllers             │    │  │
│  │  │  Layer   │  │  Auth | Admin | Cafe | Order |       │    │  │
│  │  │ JWT Auth │──│  Booking | Menu | Table | Payment    │    │  │
│  │  │ Filter   │  │  Profile | Staff | Health            │    │  │
│  │  └──────────┘  └──────────────┬──────────────────────┘    │  │
│  │                               │                            │  │
│  │  ┌────────────────────────────▼───────────────────────┐   │  │
│  │  │              Service Layer (11 services)            │   │  │
│  │  │  AuthService | OrderService | BookingService        │   │  │
│  │  │  CafeService | PaymentService | EmailService        │   │  │
│  │  └────────────────────────────┬───────────────────────┘   │  │
│  │                               │                            │  │
│  │  ┌────────────────────────────▼───────────────────────┐   │  │
│  │  │           Repository Layer (15 repos)               │   │  │
│  │  │  UserRepo | OrderRepo | CafeRepo | BookingRepo     │   │  │
│  │  └────────────────────────────┬───────────────────────┘   │  │
│  └───────────────────────────────│────────────────────────────┘  │
│                                  │ JDBC / JPA                    │
└──────────────────────────────────┼───────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────┐
│                        DATA TIER                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  MySQL Database                           │   │
│  │  users | roles | cafes | cafe_tables | menu_items        │   │
│  │  bookings | orders | order_items | payments              │   │
│  │  profiles | addresses | academic_info | work_experiences │   │
│  │  email_verification_tokens | password_reset_tokens       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────┐  ┌───────────────────────────────────┐    │
│  │  External APIs   │  │        File System                 │    │
│  │  - Razorpay      │  │  - Govt ID uploads                │    │
│  │  - Gmail SMTP    │  │  - Profile images                 │    │
│  └──────────────────┘  └───────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

## Role-Based Access Matrix

```
┌─────────────────────┬───────┬──────────┬──────┬────────┬──────────┐
│      Feature        │ ADMIN │CAFE_OWNER│ CHEF │ WAITER │ CUSTOMER │
├─────────────────────┼───────┼──────────┼──────┼────────┼──────────┤
│ Create Cafe Owner   │  ✅   │    ❌    │  ❌  │   ❌   │    ❌    │
│ Manage All Users    │  ✅   │    ❌    │  ❌  │   ❌   │    ❌    │
│ View Analytics      │  ✅   │    ✅    │  ❌  │   ❌   │    ❌    │
│ Manage Menu Items   │  ❌   │    ✅    │  ❌  │   ❌   │    ❌    │
│ Manage Tables       │  ❌   │    ✅    │  ❌  │   ❌   │    ❌    │
│ Manage Staff        │  ❌   │    ✅    │  ❌  │   ❌   │    ❌    │
│ View Pending Orders │  ❌   │    ✅    │  ✅  │   ❌   │    ❌    │
│ Mark as Preparing   │  ❌   │    ❌    │  ✅  │   ❌   │    ❌    │
│ Mark as Ready       │  ❌   │    ❌    │  ✅  │   ❌   │    ❌    │
│ Mark as Served      │  ❌   │    ❌    │  ❌  │   ✅   │    ❌    │
│ Browse Menu         │  ❌   │    ❌    │  ❌  │   ❌   │    ✅    │
│ Book Table          │  ❌   │    ❌    │  ❌  │   ❌   │    ✅    │
│ Place Order         │  ❌   │    ❌    │  ❌  │   ❌   │    ✅    │
│ Make Payment        │  ❌   │    ❌    │  ❌  │   ❌   │    ✅    │
│ Track Order         │  ❌   │    ❌    │  ❌  │   ❌   │    ✅    │
└─────────────────────┴───────┴──────────┴──────┴────────┴──────────┘
```

## Order Status State Machine

```
                    ┌─────────────────────────────────┐
                    │         ORDER LIFECYCLE          │
                    └─────────────────────────────────┘

    ╔══════════╗         ╔══════════════╗         ╔═══════════╗
    ║  PLACED  ║────────▶║  PREPARING   ║────────▶║   READY   ║
    ║          ║ (Chef)  ║              ║ (Chef)  ║           ║
    ╚════╤═════╝         ╚══════════════╝         ╚═════╤═════╝
         │                                              │
         │                                              │ (Waiter)
         ▼                                              ▼
    ╔══════════╗                                  ╔═══════════╗
    ║CANCELLED ║                                  ║  SERVED   ║
    ║          ║                                  ║  (FINAL)  ║
    ╚══════════╝                                  ╚═══════════╝

    Triggers:
    • PLACED → PREPARING : Chef clicks "Start Cooking" 
    • PREPARING → READY  : Chef clicks "Mark Ready"
    • READY → SERVED     : Waiter clicks "Mark Served"
    • PLACED → CANCELLED : Customer cancels before SERVED
```

## Booking Status Flow

```
    ╔═══════════╗       ╔═══════════════╗       ╔══════════════╗
    ║  PENDING  ║──────▶║   CONFIRMED   ║──────▶║  CHECKED_IN  ║
    ╚═════╤═════╝       ╚═══════════════╝       ╚══════╤═══════╝
          │                                            │
          ▼                                            ▼
    ╔═══════════╗                               ╔══════════════╗
    ║ CANCELLED ║                               ║  COMPLETED   ║
    ╚═══════════╝                               ╚══════════════╝
          │
          ▼
    ╔═══════════╗
    ║  NO_SHOW  ║
    ╚═══════════╝
```

## Payment Flow with Razorpay

```
┌──────────────────────────────────────────────────────────────┐
│                    PAYMENT FLOW                               │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│   Customer                Frontend              Backend       │
│      │                      │                      │          │
│      │  Click "Pay Now"     │                      │          │
│      │─────────────────────▶│                      │          │
│      │                      │ POST /payments/      │          │
│      │                      │ initiate             │          │
│      │                      │─────────────────────▶│          │
│      │                      │                      │          │
│      │                      │     Razorpay API     │          │
│      │                      │                      │──create─▶│
│      │                      │                      │◀─order ──│
│      │                      │                      │  Razorpay│
│      │                      │◀─{ orderId, key }───│          │
│      │                      │                      │          │
│      │   Razorpay Checkout  │                      │          │
│      │◀─────────────────────│                      │          │
│      │   Opens payment UPI/ │                      │          │
│      │   card/netbanking    │                      │          │
│      │                      │                      │          │
│      │  Payment Success     │                      │          │
│      │─────────────────────▶│                      │          │
│      │                      │ POST /payments/      │          │
│      │                      │ verify               │          │
│      │                      │─────────────────────▶│          │
│      │                      │                      │          │
│      │                      │        Verify HMAC   │          │
│      │                      │        signature     │          │
│      │                      │                      │          │
│      │                      │◀─ { status: OK } ───│          │
│      │  "Payment Success!"  │                      │          │
│      │◀─────────────────────│                      │          │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## Frontend Route Structure

```
/                           → Landing Page (public)
/about                      → About Page (public)
/contact                    → Contact Page (public)
/auth/login                 → Login
/auth/register              → Register
/auth/verify-email          → Email Verification
/auth/forgot-password       → Forgot Password
/auth/reset-password        → Reset Password

/admin/                     → [authGuard + roleGuard(ADMIN)]
├── dashboard               → Admin Dashboard
├── users                   → User Management
├── cafes                   → Cafe Management
├── orders                  → Order Management
├── bookings                → Booking Management
├── analytics               → Analytics
├── reports                 → Reports
├── logs                    → System Logs
├── settings                → Settings
└── profile                 → Admin Profile

/cafe-owner/ or /owner/     → [authGuard + emailGuard + roleGuard(CAFE_OWNER)]
├── dashboard               → Owner Dashboard
├── menu                    → Menu Management
├── tables                  → Table Management
├── staff                   → Staff Management
└── orders                  → Order Management

/chef/                      → [authGuard + emailGuard + roleGuard(CHEF)]
└── dashboard               → Chef Dashboard (Order Queue)

/waiter/                    → [authGuard + emailGuard + roleGuard(WAITER)]
└── dashboard               → Waiter Dashboard (Service Queue)

/customer/                  → [authGuard + emailGuard + profileGuard + roleGuard(CUSTOMER)]
├── dashboard               → Customer Dashboard
├── complete-profile        → Profile Completion
├── menu                    → Browse Menu
├── cart                    → Shopping Cart
├── booking                 → Book Table
├── payment/:orderId        → Payment
├── order-tracking          → Track Orders
└── order-tracking/:id      → Track Specific Order

/not-found                  → 404 Page
/**                         → Redirect to 404
```

---

> **Document Generated**: Complete Professional Documentation for Digital Cafe Ordering and Operations Platform
> **Total Sections**: 25 | **Total APIs**: 80+ | **Total Entities**: 16 | **Total Tables**: 16
> **Backend**: Spring Boot 3.5.10 (Java 21) | **Frontend**: Angular 20 | **Database**: MySQL
