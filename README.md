<p align="center">
  <img src="docs/images/banner.png" alt="SwiftLogistics Banner" width="100%" />
</p>

# 🚚 SwiftLogistics — Middleware-Based Logistics Management Platform

> A microservices-based logistics and delivery management system built with **FastAPI**, **React (Vite)**, **RabbitMQ**, **PostgreSQL**, and **Docker**. Designed for the SCS2314 Middleware Architecture course to demonstrate real-world middleware integration patterns.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Services Breakdown](#-services-breakdown)
- [Middleware Patterns](#-middleware-patterns)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Frontend Pages](#-frontend-pages)
- [Port Mapping](#-port-mapping)
- [Troubleshooting](#-troubleshooting)

---

## 🔍 Overview

**SwiftLogistics** is a full-stack logistics management platform that simulates an end-to-end delivery order lifecycle — from order creation by a client, through warehouse processing and route optimization, to driver assignment and final delivery confirmation.

The system is composed of loosely coupled microservices that communicate via:

- **REST APIs** — synchronous service-to-service calls
- **RabbitMQ (AMQP)** — asynchronous event-driven messaging using a fanout exchange
- **SOAP/XML** — legacy CMS integration for client management
- **Raw TCP Sockets** — communication with the Warehouse Management System (WMS)

Three distinct user roles interact with the platform through a unified React frontend:

| Role       | Capabilities                                                         |
| ---------- | -------------------------------------------------------------------- |
| **Admin**  | Create clients & drivers, view all orders, manage the entire system  |
| **Client** | Place new delivery orders, track order status, view order history    |
| **Driver** | View assigned jobs, mark deliveries as completed or failed           |

---

## 🏗 Architecture

<p align="center">
  <img src="docs/images/middleware-architecture.png" alt="SwiftLogistics Middleware Architecture" width="100%" />
</p>

<details>
<summary>📝 <strong>View ASCII Architecture Diagram</strong></summary>

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          React Frontend (Vite)                              │
│                        http://localhost:3000                                 │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │ REST (HTTP)
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          API Gateway (FastAPI)                               │
│                        http://localhost:8000                                 │
│   • JWT Authentication & Authorization                                      │
│   • Request Routing & Proxying                                              │
│   • Role-based Access Control (Admin / Client / Driver)                     │
└───┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────────────┘
    │          │          │          │          │          │
    ▼          ▼          ▼          ▼          ▼          ▼
┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐
│  Auth  ││ Order  ││ Admin  ││Tracking││Notifi- ││ Driver │
│Service ││Service ││Service ││Service ││cation  ││Service │
│ :8001  ││ :8002  ││ :8003  ││ :8004  ││Service ││ :8006  │
│        ││        ││        ││        ││ :8005  ││        │
└───┬────┘└───┬────┘└───┬────┘└────────┘└────────┘└───┬────┘
    │         │         │                              │
    │         │ publish  │                              │
    │         ▼         │                              │
    │  ┌──────────────┐ │                              │
    │  │   RabbitMQ   │ │                              │
    │  │  (Fanout     │ │                              │
    │  │  Exchange)   │ │                              │
    │  └──┬───────┬───┘ │                              │
    │     │       │     │                              │
    │     ▼       ▼     │                              │
    │ ┌───────┐┌──────┐ │                              │
    │ │  WMS  ││ ROS  │ │                              │
    │ │Adapter││Adapt.│ │                              │
    │ └───┬───┘└──┬───┘ │                              │
    │     │TCP    │REST  │                              │
    │     ▼       ▼     │ SOAP/XML + REST              │
    │ ┌───────┐┌──────┐ │    ┌──────────┐              │
    │ │  WMS  ││ ROS  │ │    │   CMS    │              │
    │ │ Mock  ││ Mock │ │    │   Mock   │              │
    │ └───────┘└──┬───┘ │    └──────────┘              │
    │             │     │         ▲                     │
    │             │REST │         │ SOAP/REST           │
    │             └─────┼─────────┘                     │
    │                   │                              │
    ▼                   ▼                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PostgreSQL Database                                   │
│                     postgresql://localhost:5433                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

</details>

---

## 🛠 Tech Stack

### Backend

| Technology          | Purpose                                            |
| ------------------- | -------------------------------------------------- |
| **Python 3.11**     | Primary backend language                           |
| **FastAPI**         | Async REST API framework for all microservices     |
| **SQLAlchemy**      | Async ORM with `asyncpg` driver                    |
| **PostgreSQL 15**   | Relational database for all services               |
| **RabbitMQ 3**      | Message broker for async event-driven messaging    |
| **Pika**            | Python AMQP client for RabbitMQ                    |
| **Jose (PyJWT)**    | JWT token creation & verification                  |
| **Passlib/Bcrypt**  | Password hashing                                   |
| **HTTPX**           | Async HTTP client for inter-service communication  |
| **Uvicorn**         | ASGI server                                        |

### Frontend

| Technology           | Purpose                                          |
| -------------------- | ------------------------------------------------ |
| **React 19**         | UI library                                       |
| **Vite 7**           | Build tool & dev server                          |
| **React Router 7**   | Client-side routing                              |
| **Axios**            | HTTP client with interceptors                    |
| **Vanilla CSS**      | Custom styling with Plus Jakarta Sans & Inter    |

### Infrastructure

| Technology           | Purpose                                          |
| -------------------- | ------------------------------------------------ |
| **Docker**           | Containerization of all services                 |
| **Docker Compose**   | Multi-container orchestration                    |
| **pgAdmin 4**        | Database administration UI                       |

---

## 📁 Project Structure

```
SwiftLogistics/
├── docker-compose.yml              # Orchestrates all 16 containers
├── .gitignore
├── .env
│
├── backend/
│   └── services/
│       ├── api-gateway/            # Central entry point — JWT auth & routing
│       │   ├── app/
│       │   │   └── gateway_app.py
│       │   ├── Dockerfile
│       │   └── requirements.txt
│       │
│       ├── auth-service/           # User registration, login, JWT issuance
│       │   ├── app/
│       │   │   ├── auth_app.py
│       │   │   ├── database.py
│       │   │   ├── models.py
│       │   │   └── schemas.py
│       │   ├── Dockerfile
│       │   └── requirements.txt
│       │
│       ├── order-service/          # Order CRUD & RabbitMQ publishing
│       │   ├── app/
│       │   │   ├── order_app.py
│       │   │   ├── rabbitmq_publisher.py
│       │   │   ├── database.py
│       │   │   ├── models.py
│       │   │   └── schemas.py
│       │   ├── Dockerfile
│       │   └── requirements.txt
│       │
│       ├── admin-service/          # Admin aggregation (clients, drivers, orders)
│       │   ├── app/
│       │   │   └── admin_app.py
│       │   ├── Dockerfile
│       │   └── requirements.txt
│       │
│       ├── driver-service/         # Driver registry & management
│       │   ├── app/
│       │   │   ├── driver.py
│       │   │   ├── database.py
│       │   │   ├── models.py
│       │   │   └── schemas.py
│       │   ├── Dockerfile
│       │   └── requirements.txt
│       │
│       ├── tracking-service/       # (Placeholder) Order tracking
│       │   ├── app/
│       │   ├── Dockerfile
│       │   └── requirements.txt
│       │
│       ├── notification-service/   # (Placeholder) Notifications
│       │   ├── app/
│       │   ├── Dockerfile
│       │   └── requirements.txt
│       │
│       ├── adapters/               # Middleware adapters
│       │   ├── cms_adapter/        # REST adapter for SOAP-based CMS
│       │   ├── ros_adapter/        # RabbitMQ consumer → ROS REST forwarder
│       │   └── wms_adapter/        # RabbitMQ consumer → WMS TCP forwarder
│       │
│       └── mock_systems/           # Simulated external systems
│           ├── cms/                # Client Management System (SOAP/XML + REST)
│           ├── ros/                # Route Optimization System (REST)
│           └── wms/                # Warehouse Management System (TCP Socket)
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── App.jsx                 # Route definitions & protected wrappers
        ├── main.jsx
        ├── index.css               # Global styles
        ├── api/
        │   └── index.js            # Axios instance & API modules
        ├── components/
        │   ├── Sidebar.jsx
        │   ├── ProtectedRoute.jsx
        │   ├── ConfirmModal.jsx
        │   ├── Pagination.jsx
        │   ├── DetailField.jsx
        │   └── ProfileField.jsx
        ├── context/
        │   ├── AuthContext.jsx      # Authentication state management
        │   └── ToastContext.jsx     # Toast notification system
        └── pages/
            ├── Login.jsx            # Login page (all roles)
            ├── admin/
            │   ├── AdminDashboard.jsx
            │   ├── Clients.jsx
            │   ├── Drivers.jsx
            │   ├── Orders.jsx
            │   ├── CreateClient.jsx
            │   └── CreateDriver.jsx
            ├── client/
            │   ├── ClientDashboard.jsx
            │   ├── ClientOrders.jsx
            │   ├── ClientProfile.jsx
            │   └── NewOrder.jsx
            └── driver/
                ├── DriverDashboard.jsx
                ├── DriverJobs.jsx
                └── DriverProfile.jsx
```

---

## ⚙ Services Breakdown

### 1. API Gateway (`api-gateway`) — Port `8000`

The **single entry point** for all frontend requests. Responsibilities:

- **JWT verification** on protected routes
- **Role-based access control** (admin, client, driver)
- **Request proxying** to downstream microservices
- **CORS middleware** for cross-origin requests

### 2. Auth Service (`auth-service`) — Port `8001`

Handles identity and access management:

- User registration with **bcrypt** password hashing
- Login with **JWT token** generation (HS256, 30-min expiry)
- Proxies client creation to CMS (via SOAP/XML) and driver creation to Driver Service
- Lists users filtered by role

### 3. Order Service (`order-service`) — Port `8002`

Manages the full order lifecycle:

- **Create orders** → persist to PostgreSQL → **publish to RabbitMQ** (fanout exchange)
- Retrieve orders by client, by driver, or all orders
- Status updates from WMS Adapter (e.g., `Ready`, `Loaded`, `Dispatched`)
- Driver assignment from ROS Adapter
- Delivery confirmation by drivers (`delivered` / `delivery_failed`)

### 4. Admin Service (`admin-service`) — Port `8003`

An **aggregation service** for the admin dashboard:

- Fetches and enriches client data from Auth Service + CMS Mock
- Fetches and enriches driver data from Auth Service + Driver Service
- Aggregates order data with client usernames

### 5. Tracking Service (`tracking-service`) — Port `8004`

> 🔧 *Placeholder — reserved for future real-time order tracking implementation.*

### 6. Notification Service (`notification-service`) — Port `8005`

> 🔧 *Placeholder — reserved for future push/email notification support.*

### 7. Driver Service (`driver-service`) — Port `8006`

Manages the driver registry:

- Create driver profiles (name, email, vehicle number)
- List all registered drivers (consumed by ROS Mock for assignment)

---

### Adapters

| Adapter           | Protocol                 | Function                                                                 |
| ----------------- | ------------------------ | ------------------------------------------------------------------------ |
| **CMS Adapter**   | REST → SOAP/XML          | Translates REST calls into SOAP envelopes for the legacy CMS system      |
| **ROS Adapter**   | RabbitMQ → REST          | Consumes order events, forwards to ROS for route optimization & driver assignment |
| **WMS Adapter**   | RabbitMQ → TCP Socket    | Consumes order events, sends to WMS via TCP, relays status updates back  |

### Mock Systems

| System       | Protocol   | Function                                                                                 |
| ------------ | ---------- | ---------------------------------------------------------------------------------------- |
| **CMS Mock** | SOAP + REST | Simulates a legacy Client Management System; stores client data, exposes SOAP & REST endpoints |
| **ROS Mock** | REST        | Simulates a Route Optimization System; assigns random routes and available drivers        |
| **WMS Mock** | TCP Socket  | Simulates a Warehouse Management System; sends sequential status updates (`Ready` → `Loaded` → `Dispatched`) |

---

## 🔗 Middleware Patterns

This project demonstrates several key middleware architecture patterns:

| Pattern                              | Implementation                                                   |
| ------------------------------------ | ---------------------------------------------------------------- |
| **API Gateway**                      | Centralized routing, auth, and request proxying                  |
| **Message-Oriented Middleware (MOM)**| RabbitMQ fanout exchange for event-driven order processing       |
| **Adapter Pattern**                  | CMS, WMS, and ROS adapters bridge protocol differences           |
| **SOAP/XML Integration**            | CMS Mock uses SOAP envelopes; CMS Adapter translates REST → SOAP|
| **Protocol Bridging**               | WMS Adapter bridges AMQP → TCP Socket communication              |
| **Service Aggregation**             | Admin Service composes data from multiple downstream services    |
| **Token-Based Authentication**      | JWT tokens for stateless, distributed authentication             |

---

## 📋 Prerequisites

Ensure the following are installed on your system:

- **Docker Desktop** (v20+) — [Download](https://www.docker.com/products/docker-desktop/)
- **Docker Compose** (v2+) — included with Docker Desktop
- **Node.js** (v18+) — [Download](https://nodejs.org/) *(only for local frontend development)*
- **Git** — [Download](https://git-scm.com/)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/senirudevidu/SwiftLogistics.git
cd SwiftLogistics
```

### 2. Start All Backend Services (Docker)

From the project root directory:

```bash
docker-compose up --build
```

This will spin up **16 containers**:

- PostgreSQL + pgAdmin
- RabbitMQ (with management UI)
- 7 application services (API Gateway, Auth, Order, Admin, Driver, Tracking, Notification)
- 3 adapters (CMS, ROS, WMS)
- 3 mock systems (CMS, ROS, WMS)

> ⏳ **First run** may take a few minutes to pull images and build containers.

### 3. Start the Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at **http://localhost:3000**.

### 4. Access the Application

| Interface              | URL                            |
| ---------------------- | ------------------------------ |
| **Frontend App**       | http://localhost:3000           |
| **API Gateway**        | http://localhost:8000           |
| **RabbitMQ Management**| http://localhost:15672          |
| **pgAdmin**            | http://localhost:5050           |

### 5. Default Credentials

| Service               | Username / Email          | Password     |
| --------------------- | ------------------------- | ------------ |
| **RabbitMQ**          | `guest`                   | `guest`      |
| **pgAdmin**           | `admin@admin.com`         | `admins`     |
| **PostgreSQL**        | `swiftlog_user`           | `swiftlog_pass` |

> **Note:** An admin user is auto-created on first startup of the Auth Service with credentials: `admin` / `admin123`

### 6. Quick Start — Typical Workflow

1. **Login** as `admin` / `admin123`
2. **Create a client** via Admin → Create Client
3. **Create a driver** via Admin → Create Driver
4. **Logout**, then login with the newly created client credentials
5. **Place an order** from the Client Dashboard
6. Watch the order flow through WMS (status updates) and ROS (driver assignment) automatically
7. **Login as the driver** → view assigned jobs → mark as delivered

---

## 🌐 Environment Variables

All environment variables are configured in `docker-compose.yml`. Key variables per service:

| Variable            | Service(s)           | Description                      |
| ------------------- | -------------------- | -------------------------------- |
| `DATABASE_URL`      | Most services        | PostgreSQL async connection string |
| `RABBITMQ_HOST`     | Order, adapters      | RabbitMQ broker hostname         |
| `RABBITMQ_PORT`     | Order, adapters      | RabbitMQ broker port (`5672`)    |
| `AUTH_SERVICE_URL`  | API Gateway          | Auth service internal URL        |
| `ORDER_SERVICE_URL` | API Gateway, adapters| Order service internal URL       |
| `CMS_URL`           | Order, Admin, CMS Adapter | CMS mock internal URL       |
| `ROS_URL`           | Order, ROS Adapter   | ROS mock internal URL            |
| `WMS_HOST/WMS_PORT` | Order, WMS Adapter   | WMS mock hostname & TCP port     |

---

## 📡 API Reference

All requests go through the **API Gateway** at `http://localhost:8000`.

### Authentication

| Method | Endpoint     | Auth     | Description                        |
| ------ | ------------ | -------- | ---------------------------------- |
| POST   | `/login`     | None     | Login with username & password     |
| GET    | `/me`        | Bearer   | Get current user info              |

### Admin Endpoints

| Method | Endpoint              | Auth         | Description                      |
| ------ | --------------------- | ------------ | -------------------------------- |
| POST   | `/admin/clients`      | Admin JWT    | Create a new client              |
| GET    | `/admin/clients`      | Admin JWT    | List all clients                 |
| POST   | `/admin/drivers`      | Admin JWT    | Create a new driver              |
| GET    | `/admin/drivers`      | Admin JWT    | List all drivers                 |
| GET    | `/orders`             | Admin JWT    | List all orders                  |
| GET    | `/admin/orders`       | Admin JWT    | List all orders (alias)          |

### Order Endpoints

| Method | Endpoint                          | Auth         | Description                        |
| ------ | --------------------------------- | ------------ | ---------------------------------- |
| POST   | `/order`                          | Client JWT   | Create a new delivery order        |
| GET    | `/orders/my`                      | Client JWT   | Get logged-in client's orders      |

### Driver Endpoints

| Method | Endpoint                          | Auth         | Description                        |
| ------ | --------------------------------- | ------------ | ---------------------------------- |
| GET    | `/driver/orders`                  | Driver JWT   | Get assigned orders                |
| PUT    | `/driver/orders/{id}/status`      | Driver JWT   | Mark order delivered / failed      |

### Internal Service Endpoints (not exposed through gateway)

| Service        | Endpoint              | Method | Description                          |
| -------------- | --------------------- | ------ | ------------------------------------ |
| Order Service  | `/create`             | POST   | Create order (internal)              |
| Order Service  | `/update-status`      | PUT    | Update order status (from WMS)       |
| Order Service  | `/assign-driver`      | PUT    | Assign driver to order (from ROS)    |
| CMS Mock       | `/soap/users`         | POST   | SOAP endpoint for client creation    |
| CMS Mock       | `/clients`            | GET    | REST endpoint to list clients        |
| ROS Mock       | `/process_order`      | POST   | Route optimization & driver selection|
| WMS Mock       | TCP `:9000`           | —      | TCP socket for warehouse processing  |

---

## 🖥 Frontend Pages

### Public

| Page       | Route      | Description                                    |
| ---------- | ---------- | ---------------------------------------------- |
| Login      | `/login`   | Unified login for all roles                    |

### Admin Panel

| Page             | Route                  | Description                          |
| ---------------- | ---------------------- | ------------------------------------ |
| Dashboard        | `/admin/dashboard`     | Overview with stats and summaries    |
| Clients          | `/admin/clients`       | Client list with management options  |
| Drivers          | `/admin/drivers`       | Driver list with management options  |
| Orders           | `/admin/orders`        | All orders with status tracking      |
| Create Client    | `/admin/create-client` | Registration form for new clients    |
| Create Driver    | `/admin/create-driver` | Registration form for new drivers    |

### Client Panel

| Page             | Route                | Description                           |
| ---------------- | -------------------- | ------------------------------------- |
| Dashboard        | `/client/dashboard`  | Client overview                       |
| My Orders        | `/client/orders`     | Order history & status tracking       |
| New Order        | `/client/new-order`  | Place a new delivery order            |
| Profile          | `/client/profile`    | View account profile                  |

### Driver Panel

| Page             | Route                | Description                           |
| ---------------- | -------------------- | ------------------------------------- |
| Dashboard        | `/driver/dashboard`  | Driver overview & stats               |
| My Jobs          | `/driver/jobs`       | Assigned deliveries & actions         |
| Profile          | `/driver/profile`    | View driver profile                   |

---

## 🔌 Port Mapping

| Service                | Host Port | Container Port | Protocol   |
| ---------------------- | --------- | -------------- | ---------- |
| Frontend (Vite)        | 3000      | —              | HTTP       |
| API Gateway            | 8000      | 8000           | HTTP       |
| Auth Service           | 8001      | 8000           | HTTP       |
| Order Service          | 8002      | 8000           | HTTP       |
| Admin Service          | 8003      | 8000           | HTTP       |
| Tracking Service       | 8004      | 8000           | HTTP       |
| Notification Service   | 8005      | 8000           | HTTP       |
| Driver Service         | 8006      | 8000           | HTTP       |
| CMS Mock               | 8200      | 8200           | HTTP/SOAP  |
| ROS Mock               | 8100      | 8100           | HTTP       |
| WMS Mock               | 8300      | 8300/9000      | HTTP/TCP   |
| CMS Adapter            | 8201      | 8000           | HTTP       |
| ROS Adapter            | 8101      | 8000           | HTTP       |
| WMS Adapter            | 8301      | 8000           | HTTP       |
| PostgreSQL             | 5433      | 5432           | TCP        |
| pgAdmin                | 5050      | 80             | HTTP       |
| RabbitMQ (AMQP)        | 5672      | 5672           | AMQP       |
| RabbitMQ (Management)  | 15672     | 15672          | HTTP       |

---

## 🔄 Order Processing Flow

The following describes the complete lifecycle of an order:

```
Client places order
       │
       ▼
┌──────────────┐     REST      ┌──────────────┐
│  API Gateway │ ──────────▶  │ Order Service │
└──────────────┘              └──────┬───────┘
                                     │
                          ┌──────────┼──────────┐
                          │  Save to DB          │
                          │  Publish to RabbitMQ │
                          └──────────┼──────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    ▼ (fanout)                        ▼ (fanout)
           ┌──────────────┐                  ┌──────────────┐
           │  WMS Adapter │                  │  ROS Adapter │
           └──────┬───────┘                  └──────┬───────┘
                  │ TCP                              │ REST
                  ▼                                  ▼
           ┌──────────────┐                  ┌──────────────┐
           │   WMS Mock   │                  │   ROS Mock   │
           │              │                  │              │
           │ Ready        │                  │ Select Route │
           │ Loaded       │                  │ Assign Driver│
           │ Dispatched   │                  └──────┬───────┘
           └──────┬───────┘                         │
                  │                                  │
                  ▼ PUT /update-status               ▼ PUT /assign-driver
           ┌─────────────────────────────────────────────────┐
           │              Order Service (DB Update)          │
           └─────────────────────────────────────────────────┘
                                     │
                                     ▼
                          Driver sees assigned job
                          Driver marks as delivered ✅
```

---

## 🐛 Troubleshooting

### Services fail to start

```bash
# Rebuild all containers from scratch
docker-compose down -v
docker-compose up --build
```

### RabbitMQ connection errors

RabbitMQ may take 15-30 seconds to initialize. Adapters have built-in retry logic (30 attempts, 3s intervals). If issues persist:

```bash
docker-compose restart rabbitmq
docker-compose restart wms-adapter ros-adapter
```

### Database connection errors

Ensure PostgreSQL is fully initialized before other services:

```bash
docker-compose up -d postgres
# Wait a few seconds, then start the rest
docker-compose up --build
```

### Frontend cannot reach API Gateway

- Verify the API Gateway is running on port `8000`
- Check the browser console for CORS errors
- Ensure `http://localhost:8000` is accessible

### Port conflicts

If any port is already in use on your host machine, modify the host-side port mapping in `docker-compose.yml`:

```yaml
ports:
  - "NEW_PORT:8000"  # Change left side only
```

### View service logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f order-service
docker-compose logs -f wms-adapter
```

---

## 📄 License

This project is developed as part of the **SCS2314 — Middleware Architecture** coursework and is intended for educational purposes.

---

<p align="center">
  Built with ❤️ using FastAPI, React, RabbitMQ & Docker
</p>
