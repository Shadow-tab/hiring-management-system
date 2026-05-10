# Hiring Management System

A full-stack hiring and recruitment platform built with Node.js, Express, Oracle XE, and vanilla HTML/CSS/JS. Supports three user roles: Company, Candidate, and Interviewer, each with their own dashboard and data scope.

---

## Tech Stack

- **Backend:** Node.js, Express
- **Database:** Oracle XE 21c (via Docker)
- **Frontend:** Vanilla HTML, CSS, JavaScript
- **ORM:** oracledb (thin mode, connection pool)

---

## Project Structure

```
hiring-management-system/
├── backend/
│   ├── server.js       # Express API routes
│   └── db.js           # Oracle connection pool
├── frontend/           # All HTML pages and JS
├── sql/
│   ├── 01_create_tables.sql
│   ├── 02_insert_data.sql
│   ├── 03_queries.sql
│   ├── 04_views.sql
│   ├── 05_procedures.sql
│   ├── 06_triggers.sql
│   └── 07_seed_data.sql
├── .env
└── package.json
```

---

## Setup

### Prerequisites

- Node.js 18+
- Docker
- Oracle XE 21c container running on port 1521

### 1. Start Oracle Database

```bash
docker run -d \
  --name oracle-xe \
  -p 1521:1521 \
  -e ORACLE_PASSWORD=Oracle21c# \
  gvenzl/oracle-xe:21-slim
```

### 2. Create DB User and Schema

Connect as SYSTEM and run once:

```sql
CREATE USER hiring_app IDENTIFIED BY hiring123;
GRANT CONNECT, RESOURCE, CREATE VIEW TO hiring_app;
GRANT UNLIMITED TABLESPACE TO hiring_app;
```

Then run the SQL files in order (01 through 07) as `hiring_app`.

### 3. Configure Environment

Create a `.env` file in the project root:

```
DB_USER=hiring_app
DB_PASSWORD=hiring123
DB_CONNECT_STRING=localhost:1521/XE
PORT=3000
```

### 4. Install Dependencies and Start

```bash
npm install
npm start
```

The API server runs on `http://localhost:3000`. Open any file in `frontend/` directly in a browser, or serve it with a static server.

---

## User Roles

| Role | Login | Capabilities |
|---|---|---|
| Company | Company email | Post jobs, view applications, schedule interviews, make hiring decisions |
| Candidate | Candidate email | Browse jobs, apply, track applications and offers |
| Interviewer | Interviewer email | View assigned interviews and related applications |

Demo accounts are included in `sql/07_seed_data.sql`. Example logins:

```
technova@hms.com     /  tech1234     (Company)
bilal.hassan@gmail.com / bilal123    (Candidate)
ahmed.raza@technova.pk / ahmed123   (Interviewer)
```

---

## API

Base URL: `http://localhost:3000/api`

Key endpoints:

```
POST  /auth/login
POST  /auth/register

GET   /candidates
GET   /jobs
GET   /applications
GET   /interviews
GET   /offers
GET   /decisions

GET   /my/company-interviews?company_id=
GET   /my/company-decisions?company_id=
GET   /my/interviewer-interviews?interviewer_id=
```

---

## Database

The schema covers 12 entities including COMPANY, CANDIDATE, JOB_POSTING, APPLICATION, INTERVIEW (with PHONE_SCREEN, TECH_INTERVIEW, PANEL_INTERVIEW subtypes via disjoint specialization), OFFER, and HIRING_DECISION. Includes stored procedures, triggers, and views defined in the SQL files.
