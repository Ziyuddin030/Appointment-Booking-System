---

# 🩺 Appointment Booking System (Rails + React Monorepo)

A modern **Appointment Booking System** built with **Ruby on Rails (API-only backend)** and **React (frontend)**.
It allows users to sign up, log in, view available time slots, and manage (book, view, and cancel) their appointments.

---

## ⚙️ Technology Stack

* **Backend:**

  * Ruby 3.2.2
  * Ruby on Rails 7.1.6 (API-only)
  * PostgreSQL
  * JWT & BCrypt for authentication
  * Rack CORS for API access
* **Frontend:**

  * React 18.3
  * Material-UI 7.3
  * React Router 7.9
  * Axios for API calls
  * Day.js for date handling
* **Database:** PostgreSQL
* **Authentication:** JWT using Rails secrets
* **API Architecture:** RESTful

---

## 🗂️ Project Structure

```
appointment-booking-system/
│
├── backend/           # Rails API backend
│   ├── app/
│   ├── config/
│   ├── db/
│   └── ...
│
└── frontend/          # React app
    ├── src/
    ├── public/
    └── ...
```

---

## 🧰 System Requirements

* Node.js 16+ and npm
* Ruby 3.2.2
* PostgreSQL 12+
* Git

---

## 🧰 Local Setup

### 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/appointment-booking-system.git
cd appointment-booking-system
```

---

### 2️⃣ Backend Setup

```bash
cd backend
bundle install
rails db:create
rails db:migrate
```

🪶 **PostgreSQL Configuration (if required locally):**

Edit `config/database.yml` with your credentials:

```yaml
username: your_postgres_username
password: your_postgres_password
```

Create a master key and credentials (if not exists):

```bash
rails credentials:edit
```

Set up your environment variables in `config/environments/development.rb`:

```ruby
config.allowed_cors_origins = ['http://localhost:3001']
```

Start the Rails API:

```bash
rails s
```

Backend will run on: **[http://localhost:3000](http://localhost:3000)**

---

### 3️⃣ Frontend Setup

```bash
cd ../frontend
npm install
npm start
```

If you face issues with `npm start`, try:

```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
npm start
```

Frontend will run on: **[http://localhost:3001](http://localhost:3001)**

---

## 🔐 Authentication API

### 📝 Signup

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "password_confirmation": "password123"
  }'
```

✅ **Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

---

### 🔑 Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

✅ **Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

❌ **Error Example:**

```json
{ "error": "Invalid credentials" }
```

---

## 📅 Appointment API

All appointment endpoints require:

```
Authorization: Bearer <your_jwt_token>
```

---

### 📄 List Appointments

```bash
curl -X GET http://localhost:3000/api/appointments?page=1&per_page=10 \
  -H "Authorization: Bearer <your_jwt_token>"
```

✅ **Response:**

```json
{
  "page": 1,
  "per_page": 10,
  "total": 2,
  "total_pages": 1,
  "appointments": [
    {
      "id": 1,
      "name": "Alice",
      "email": "alice@example.com",
      "phone": "9876543210",
      "reason": "Consultation",
      "starts_at": "2025-11-05T09:30:00Z"
    }
  ]
}
```

---

### 🕓 Get Available Time Slots

```bash
curl -X GET "http://localhost:3000/api/appointments/available?timezone=UTC" \
  -H "Content-Type: application/json"
```

✅ **Response:**

```json
{
  "timezone": "UTC",
  "slots": [
    { "starts_at": "2025-11-04T09:00:00Z", "available": true },
    { "starts_at": "2025-11-04T09:30:00Z", "available": false }
  ]
}
```

---

### ➕ Create Appointment

```bash
curl -X POST http://localhost:3000/api/appointments \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "appointment": {
      "starts_at": "2025-11-04T10:00:00Z",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "1234567890",
      "reason": "Initial Consultation"
    }
  }'
```

✅ **Response:**

```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "reason": "Initial Consultation",
  "starts_at": "2025-11-04T10:00:00Z"
}
```

---

### ❌ Cancel Appointment

```bash
curl -X DELETE http://localhost:3000/api/appointments/1 \
  -H "Authorization: Bearer <your_jwt_token>"
```

✅ **Response:**

```json
{ "message": "Cancelled" }
```

❌ **Error (Not Found):**

```json
{ "error": "Not found" }
```

---

## ⚠️ Error Handling

All API endpoints follow consistent error response formats:

```json
{
  "error": "Error message here",
  "details": ["Additional error details if any"]
}
```

### HTTP Status Codes

* `200 OK` — Successful request
* `201 Created` — Resource successfully created
* `400 Bad Request` — Invalid parameters
* `401 Unauthorized` — Missing or invalid authentication
* `403 Forbidden` — Authenticated but not authorized
* `404 Not Found` — Resource not found
* `422 Unprocessable Entity` — Validation errors
* `500 Internal Server Error` — Server error

---

## 🚀 Run the Application

**Backend (Rails):**

```bash
cd backend
rails s
```

**Frontend (React):**

```bash
cd frontend
npm start
```

### Application URLs

* **Backend API:** [http://localhost:3000](http://localhost:3000)
* **Frontend App:** [http://localhost:3001](http://localhost:3001)

#### Application deployed URLs(render)

* **Backend API:** [https://appointment-booking-system-h1d0.onrender.com/](https://appointment-booking-system-h1d0.onrender.com/)
* **Frontend App:** [https://appointment-booking-system-1-kkdz.onrender.com/](https://appointment-booking-system-1-kkdz.onrender.com/)

### 🎥 Demo / Recording

You can view the demo recording here:

https://github.com/user-attachments/assets/f391075a-ae70-4ab7-87d1-7cda6e3a685c

---

💡 **Note:**
JWT secret is managed securely by **Rails credentials** (`Rails.application.secret_key_base`), so you don’t need to create a `.env` file for JWT manually.

---

