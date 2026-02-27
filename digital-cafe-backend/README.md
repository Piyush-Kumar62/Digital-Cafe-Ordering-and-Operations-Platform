# Digital Café Ordering and Operations Platform - Backend

A comprehensive, enterprise-grade multi-café ordering and operations management system built with Java 21 and Spring Boot 3.5 LTS.

## 🚀 Features

### Authentication & Authorization

- JWT-based authentication with access and refresh tokens
- Role-based access control (ADMIN, CAFE_OWNER, CHEF, WAITER, CUSTOMER)
- Email verification system
- Mandatory profile completion before system access
- Secure password management with BCrypt encoding
- Temporary password generation for password recovery

### User Management

- User registration with email verification
- Comprehensive user profiles with completion tracking
- Academic information and work experience management
- Address management
- Profile completion percentage calculation (minimum 80% required)

### Café Management

- Multi-café support
- Café CRUD operations by café owners
- Table management with availability tracking
- Menu item management with categories
- Staff management (Chef, Waiter assignments)

### Booking System

- Table reservation with conflict detection
- Date and time slot management
- Guest capacity validation
- Special requests handling
- Booking confirmation and cancellation
- Automated email notifications

### Order Management

- Pre-order food items before arrival
- Order workflow: PLACED → PREPARING → READY → SERVED
- Real-time order status updates via WebSocket
- Role-specific order views (Chef, Waiter, Customer)
- Order history and tracking
- Special instructions support

### Payment Integration

- Razorpay payment gateway integration
- Secure payment processing before customer arrival
- Payment verification and webhook handling
- Transaction history
- TEST mode for development

### Real-Time Notifications

- WebSocket implementation with STOMP protocol
- Real-time order status updates
- Chef notifications for new orders
- Waiter notifications for ready orders
- Customer notifications for order progress

### Email Services

- Asynchronous email sending
- Email verification links
- Booking confirmations and cancellations
- Temporary password delivery
- Order status notifications

## 🛠️ Technology Stack

- **Java**: 21 LTS
- **Spring Boot**: 3.5.10 LTS
- **Spring Security**: JWT authentication
- **Spring Data JPA**: Database operations
- **Spring WebSocket**: Real-time notifications
- **Hibernate**: ORM
- **MySQL**: Relational database
- **Flyway**: Database migration
- **MapStruct**: DTO-Entity mapping
- **Lombok**: Boilerplate reduction
- **Razorpay SDK**: Payment gateway
- **JavaMailSender**: Email services
- **OpenAPI/Swagger**: API documentation
- **Maven**: Build tool

## 📋 Prerequisites

- JDK 21 or higher
- MySQL 8.0 or higher
- Maven 3.8 or higher
- Gmail account (for SMTP)
- Razorpay account (for payment integration)

## 🔧 Configuration

### 1. Database Setup

```sql
CREATE DATABASE digital_cafe_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Application Configuration

Update `src/main/resources/application.properties`:

```properties
# Database Configuration
spring.datasource.url=jdbc:mysql://localhost:3306/digital_cafe_db?createDatabaseIfNotExist=true
spring.datasource.username=your_mysql_username
spring.datasource.password=your_mysql_password

# JWT Configuration (Generate your own secret key)
jwt.secret=your_jwt_secret_key_here
jwt.expiration=86400000
jwt.refresh-expiration=604800000

# Email Configuration (Gmail SMTP)
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-specific-password

# Frontend URL
app.frontend.url=http://localhost:4200

# Payment Gateway (Development)
payment.gateway=TEST
razorpay.key.id=your_razorpay_key_id
razorpay.key.secret=your_razorpay_key_secret
```

### 3. Gmail App Password

1. Enable 2-Factor Authentication on your Gmail account
2. Go to Google Account > Security > 2-Step Verification > App passwords
3. Generate a new app password for "Mail"
4. Use this password in `spring.mail.password`

### 4. Razorpay Setup (Optional - For Live Deployment)

1. Sign up at [Razorpay](https://razorpay.com/)
2. Get API keys from Dashboard
3. Update `razorpay.key.id` and `razorpay.key.secret`
4. Set `payment.gateway=RAZORPAY`

## 🚀 Running the Application

### 1. Build the Project

```bash
mvn clean install
```

### 2. Run Database Migrations

Flyway will automatically run migrations on startup. The initial schema includes:

- All required tables
- Foreign key relationships
- Indexes for performance
- Default admin user (username: `admin`, password: `Admin@123`)
- Default roles (ADMIN, CAFE_OWNER, CHEF, WAITER, CUSTOMER)

### 3. Start the Application

```bash
mvn spring-boot:run
```

Or run the JAR:

```bash
java -jar target/digital-cafe-backend-0.0.1-SNAPSHOT.jar
```

The application will start on `http://localhost:8080`

## 📖 API Documentation

### Swagger UI

Access interactive API documentation at:

```
http://localhost:8080/swagger-ui.html
```

### OpenAPI Specification

```
http://localhost:8080/v3/api-docs
```

## 🔐 Authentication Flow

### 1. Customer Registration

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response**:

- Confirmation message
- Verification email sent
- User ID returned

### 2. Email Verification

Click the verification link in email or use:

```http
GET /api/auth/verify-email?token={verification_token}
```

### 3. Profile Completion

```http
POST /api/profile
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1995-05-15",
  "gender": "MALE",
  "phoneNumber": "+919876543210",
  "address": {
    "street": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "country": "India"
  }
}
```

**Note**: Profile completion percentage must be ≥ 80% to access the system.

### 4. Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "johndoe",
  "password": "SecurePass123!"
}
```

**Response**:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "userId": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "emailVerified": true,
  "profileComplete": true,
  "roles": ["CUSTOMER"],
  "message": "Login successful"
}
```

### 5. Using JWT Token

Include the access token in all subsequent requests:

```http
Authorization: Bearer {access_token}
```

## 🏗️ Architecture

### Layered Architecture

```
┌─────────────────────────────────────┐
│          Controller Layer           │  ← REST endpoints
│  (AuthController, OrderController)  │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│           Service Layer             │  ← Business logic
│  (AuthService, OrderServiceImpl)    │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│         Repository Layer            │  ← Data access
│  (UserRepository, OrderRepository)  │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│            Database                 │  ← MySQL
│         (digital_cafe_db)           │
└─────────────────────────────────────┘
```

### Entity Relationships

```
User ─────┐
          │
          ├──< Role (ManyToMany)
          │
          ├──< Profile (OneToOne)
          │   └──< Address (OneToOne)
          │   └──< AcademicInfo (OneToMany)
          │   └──< WorkExperience (OneToMany)
          │
          └──< EmailVerificationToken (OneToMany)

Cafe ─────┐
          ├──< CafeTable (OneToMany)
          ├──< MenuItem (OneToMany)
          ├──< Booking (OneToMany)
          └──< Order (OneToMany)

Booking ──┐
          ├──< Order (OneToOne)
          └──< Payment (through Order)

Order ────┐
          ├──< OrderItem (OneToMany)
          └──< Payment (OneToOne)
```

## 🔒 Security

### JWT Token Structure

- **Access Token**: 24 hours validity
- **Refresh Token**: 7 days validity
- **Algorithm**: HS256 (HMAC-SHA256)
- **Claims**: username, roles, issued_at, expiration

### Security Rules

1. **Public Endpoints** (no authentication):
   - `/api/auth/register`
   - `/api/auth/login`
   - `/api/auth/verify-email`
   - `/swagger-ui/**`
   - `/v3/api-docs/**`

2. **Authenticated Endpoints**:
   - Email must be verified
   - Profile must be complete (≥ 80%)
   - Active account status

3. **Role-Based Access**:
   - **ADMIN**: System-wide management
   - **CAFE_OWNER**: Café management, staff creation
   - **CHEF**: View and update order preparation status
   - **WAITER**: Serve orders, update served status
   - **CUSTOMER**: Book tables, place orders, make payments

### Password Security

- Minimum 8 characters
- BCrypt encoding with strength 10
- Temporary password generation for recovery
- Force password reset after temp password usage

## 📊 Database Schema

### Core Tables

- `users`: User authentication and basic info
- `roles`: System roles
- `user_roles`: User-role mapping
- `profiles`: User profile details
- `addresses`: User addresses
- `academic_info`: Education history
- `work_experiences`: Work history
- `email_verification_tokens`: Email verification
- `cafes`: Café information
- `cafe_tables`: Table management
- `menu_items`: Menu items
- `bookings`: Table reservations
- `orders`: Food orders
- `order_items`: Order line items
- `payments`: Payment transactions

### Indexes

- Primary keys on all tables
- Foreign key indexes
- Username and email indexes
- Booking date/time composite index
- Order status index
- Payment transaction ID index

## 🔔 WebSocket Integration

### Connection

```javascript
const socket = new SockJS("http://localhost:8080/ws");
const stompClient = Stomp.over(socket);

stompClient.connect({}, function (frame) {
  console.log("Connected: " + frame);
});
```

### Subscriptions

**Chef** (new orders):

```javascript
stompClient.subscribe("/topic/cafe/{cafeId}/new-orders", function (notification) {
  const order = JSON.parse(notification.body);
  // Handle new order notification
});
```

**Waiter** (ready orders):

```javascript
stompClient.subscribe("/topic/cafe/{cafeId}/ready-orders", function (notification) {
  const order = JSON.parse(notification.body);
  // Handle ready order notification
});
```

**Customer** (order status):

```javascript
stompClient.subscribe("/topic/customer/{customerId}/orders", function (notification) {
  const order = JSON.parse(notification.body);
  // Handle order status update
});
```

## 💳 Payment Flow

### 1. Create Order

Customer creates an order with menu items.

### 2. Initiate Payment

```http
POST /api/payments/initiate
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "orderId": 1,
  "amount": 850.00
}
```

**Response**:

```json
{
  "orderId": "order_abcd1234",
  "amount": 85000,
  "currency": "INR",
  "receipt": "receipt_123"
}
```

### 3. Complete Payment

After Razorpay checkout success:

```http
POST /api/payments/verify
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "orderId": 1,
  "razorpayPaymentId": "pay_xyz789",
  "razorpayOrderId": "order_abcd1234",
  "razorpaySignature": "signature_hash"
}
```

### 4. Payment Verification

- Signature verification using HMAC-SHA256
- Payment status updated to COMPLETED
- Order status remains PLACED
- Customer can now visit café

## 📧 Email Templates

The system sends automated emails for:

1. **Email Verification**
   - Subject: "Verify Your Email - Digital Café Platform"
   - Contains verification link

2. **Temporary Password**
   - Subject: "Password Reset - Digital Café Platform"
   - Contains temporary password

3. **Booking Confirmation**
   - Subject: "Booking Confirmation - {Cafe Name}"
   - Booking details with date/time

4. **Booking Cancellation**
   - Subject: "Booking Cancelled - {Cafe Name}"
   - Cancellation reason

5. **Order Status Updates**
   - Subject: "Order Status Update - {Order Number}"
   - Current status and estimated time

## 🧪 Testing

### Default Admin Credentials

```
Username: admin
Password: Admin@123
Email: admin@digitalcafe.com
```

### Test Payment Mode

Set `payment.gateway=TEST` in application.properties for testing without real transactions.

### Sample Test Flow

1. Register as customer → Verify email → Complete profile
2. Admin creates café owner → Café owner logs in
3. Café owner creates café, adds tables, adds menu items
4. Café owner creates chef and waiter accounts
5. Customer books a table
6. Customer places an order
7. Customer makes payment (TEST mode)
8. Chef marks order as PREPARING
9. Chef marks order as READY
10. Waiter marks order as SERVED

## 📝 API Endpoints Summary

### Authentication

- `POST /api/auth/register` - Register customer
- `POST /api/auth/login` - Login
- `GET /api/auth/verify-email` - Verify email
- `POST /api/auth/resend-verification` - Resend verification
- `POST /api/auth/forgot-password` - Request temp password
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - Logout

### Profile

- `GET /api/profile` - Get profile
- `POST /api/profile` - Create/update profile
- `POST /api/profile/academic` - Add academic info
- `PUT /api/profile/academic/{id}` - Update academic info
- `DELETE /api/profile/academic/{id}` - Delete academic info
- `POST /api/profile/work-experience` - Add work experience
- `PUT /api/profile/work-experience/{id}` - Update work experience
- `DELETE /api/profile/work-experience/{id}` - Delete work experience

### Cafés

- `GET /api/cafes` - List all cafés
- `GET /api/cafes/{id}` - Get café details
- `POST /api/cafes` - Create café (CAFE_OWNER)
- `PUT /api/cafes/{id}` - Update café (CAFE_OWNER)
- `DELETE /api/cafes/{id}` - Delete café (CAFE_OWNER)

### Tables

- `GET /api/tables/cafe/{cafeId}` - Get café tables
- `POST /api/tables` - Create table (CAFE_OWNER)
- `PUT /api/tables/{id}` - Update table (CAFE_OWNER)
- `DELETE /api/tables/{id}` - Delete table (CAFE_OWNER)

### Menu Items

- `GET /api/menu-items/cafe/{cafeId}` - Get café menu
- `POST /api/menu-items` - Create menu item (CAFE_OWNER)
- `PUT /api/menu-items/{id}` - Update menu item (CAFE_OWNER)
- `DELETE /api/menu-items/{id}` - Delete menu item (CAFE_OWNER)

### Bookings

- `POST /api/bookings` - Create booking (CUSTOMER)
- `GET /api/bookings/{id}` - Get booking details
- `GET /api/bookings/customer/{customerId}` - Customer bookings
- `GET /api/bookings/cafe/{cafeId}` - Café bookings
- `POST /api/bookings/{id}/confirm` - Confirm booking
- `POST /api/bookings/{id}/cancel` - Cancel booking

### Orders

- `POST /api/orders` - Create order (CUSTOMER)
- `GET /api/orders/{id}` - Get order details
- `GET /api/orders/customer/{customerId}` - Customer orders
- `GET /api/orders/cafe/{cafeId}/new` - New orders (CHEF)
- `GET /api/orders/cafe/{cafeId}/ready` - Ready orders (WAITER)
- `PUT /api/orders/{id}/preparing` - Mark as preparing (CHEF)
- `PUT /api/orders/{id}/ready` - Mark as ready (CHEF)
- `PUT /api/orders/{id}/served` - Mark as served (WAITER)
- `POST /api/orders/{id}/cancel` - Cancel order

### Payments

- `POST /api/payments/initiate` - Initiate payment
- `POST /api/payments/verify` - Verify payment
- `GET /api/payments/order/{orderId}` - Get payment status

## 🚦 Health Check

```http
GET /actuator/health
```

**Response**:

```json
{
  "status": "UP"
}
```

## 📚 Additional Resources

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [Spring Security JWT](https://spring.io/guides/topicals/spring-security-architecture)
- [MapStruct Documentation](https://mapstruct.org/)
- [Razorpay API Docs](https://razorpay.com/docs/api/)
- [Flyway Migrations](https://flywaydb.org/documentation/)

## 🤝 Contributing

1. Follow clean code principles and SOLID design
2. Use DTOs for all API requests and responses
3. Never expose entities directly
4. Add proper logging for debugging
5. Write unit tests for business logic
6. Update API documentation

## 📄 License

MIT License - See LICENSE file for details

## 👥 Support

For issues and questions:

- Create an issue in the repository
- Contact: support@digitalcafe.com

---

**Built with ❤️ using Java 21 LTS and Spring Boot 3.5 LTS**
