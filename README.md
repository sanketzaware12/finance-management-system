#  Finance Management System

A full-stack Finance Management System developed to manage users, transactions, loans, EMI schedules, and EMI payments through a responsive and user-friendly web application.

## Project Overview

The Finance Management System provides a centralized platform for managing financial activities. Users can register, securely sign in, manage transactions, create loans, generate EMI schedules, and track EMI payments.

The application uses a REST API based architecture with a separate frontend and backend.

## Features

###  User Management

* User Registration
* User Login
* JWT-based Authentication
* User Profile Management
* Secure API access

###  Transaction Management

* Create new transactions
* View transaction history
* Delete transactions
* Automatic balance updates
* Transaction reference generation

###  Loan Management

* Create loans
* View loan details
* Track loan information
* Manage loan status

###  EMI Management

* Generate EMI schedules
* View EMI schedule
* Track principal and interest
* Track EMI payment status
* Pay EMI
* Automatic EMI status updates

###  Dashboard

* Financial overview
* Account balance
* Transaction summary
* Loan information
* EMI information

###  User Interface

* Responsive design
* Professional and clean UI
* Tailwind CSS
* JavaScript-based frontend
* Professional icons
* User-friendly notifications
* Mobile, tablet and desktop support

##  Technologies Used

### Frontend

* HTML5
* Tailwind CSS
* JavaScript
* REST API Integration

### Backend

* Java
* Spring Boot
* Spring Data JPA
* Hibernate
* Spring Security
* JWT
* REST APIs

### Database

* MySQL

### Tools

* Eclipse / Spring Tool Suite
* Visual Studio Code
* MySQL Workbench
* Maven
* Git & GitHub

##  Project Modules

1. User Registration & Authentication
2. Dashboard
3. User Management
4. Transaction Management
5. Loan Management
6. EMI Management
7. EMI Payment
8. Account Management

##  Project Architecture

Frontend
   ↓
HTML + Tailwind CSS + JavaScript
   ↓
REST APIs
   ↓
Spring Boot Backend
   ↓
Spring Security + JWT
   ↓
Spring Data JPA / Hibernate
   ↓
MySQL Database


##  Requirements

Before running the project, install:

* Java JDK 21
* Maven
* MySQL Server
* MySQL Workbench
* Visual Studio Code / Eclipse / STS
* Modern Web Browser

##  Backend Setup

### 1. Open the backend project

Open the `backend` folder in Eclipse or Spring Tool Suite.

### 2. Configure MySQL

Create the database:

```sql
CREATE DATABASE finance_management_system;
```

Update the database configuration in:

```text
backend/src/main/resources/application.properties
```

Example:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/finance_management_system
spring.datasource.username=root
spring.datasource.password=YOUR_PASSWORD
```

### 3. Run the Backend

Run the Spring Boot application.

The backend normally runs on:

```text
http://localhost:8080
```

##  Frontend Setup

Open the `frontend` folder in Visual Studio Code.

Run `index.html` using **Live Server**.

Make sure the Spring Boot backend is running before using the frontend application.

##  Authentication Flow

```text
Register
   ↓
Sign In
   ↓
JWT Token
   ↓
Authenticated API Requests
   ↓
Dashboard
```

##  Main API Modules

### User APIs

```text
POST   /api/users
GET    /api/users
GET    /api/users/{id}
PUT    /api/users/{id}
DELETE /api/users/{id}
```

### Authentication API

```text
POST /api/auth/login
```

### Transaction APIs

```text
POST   /api/transactions
GET    /api/transactions
GET    /api/transactions/{id}
DELETE /api/transactions/{id}
```

### Loan APIs

```text
POST /api/loans
GET  /api/loans
```

### EMI APIs

```text
POST /api/emi/generate
GET  /api/emi/schedule
POST /api/emi/pay
```

##  Application Flow

```text
User Registration
        ↓
     Sign In
        ↓
    Dashboard
        ↓
 ┌──────┼─────────┐
 ↓      ↓         ↓
Transactions    Loans
 ↓                ↓
Balance       Generate EMI
                  ↓
             EMI Schedule
                  ↓
               Pay EMI
```

##  Security

* JWT-based authentication
* Protected REST APIs
* Public user registration
* Password validation
* Authenticated user operations
* CORS configuration

##  Responsive Design

The application supports:

*  Desktop
*  Laptop
*  Mobile
*  Tablet

##  Future Enhancements

* Admin dashboard
* Financial reports
* Charts and analytics
* Email notifications
* PDF financial reports
* Online payment gateway
* Expense categorization
* Budget management
* Monthly financial statements

##  Author

**Sanket Zaware**

Full Stack Java Developer

**Technologies:** Java | Spring Boot | MySQL | HTML | Tailwind CSS | JavaScript

