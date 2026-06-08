# Blue Ridge Academy

Full-stack school management app with role-based dashboards for `Admin`, `Teacher`, and `Student`.

## Stack

- Frontend: React + Vite + React Router + TanStack Query + Axios
- Backend: Node.js + Express + Prisma + PostgreSQL + JWT auth
- DevOps: Docker, docker-compose, nginx

## Project Structure

```text
.
|-- src/
|-- server/
|   |-- prisma/
|   |-- src/
|   |   |-- middleware/
|   |   `-- routes/
|   |-- .env.example
|   |-- Dockerfile
|   `-- package.json
|-- Dockerfile
|-- docker-compose.yml
`-- README.md
```

## Local Setup

### 1. Backend

1. Copy `server/.env.example` to `server/.env` and set `DATABASE_URL`, `JWT_SECRET`, and `PORT`.
2. Start a PostgreSQL database locally.
3. Install dependencies:

```bash
cd server
npm install
```

4. Run migrations and seed data:

```bash
npx prisma migrate deploy
npm run prisma:seed
```

5. Start the API:

```bash
npm run dev
```

The backend runs on `http://localhost:4000`.

### 2. Frontend

1. Install dependencies from the project root:

```bash
npm install
```

2. Start the Vite app:

```bash
npm run dev
```

The frontend runs on `http://localhost:5173` and proxies `/api` requests to `http://localhost:4000`.

## Docker Setup

1. Copy `.env.example` to `.env`.
2. Start the full stack:

```bash
docker compose up --build
```

Services:

- Client: `http://localhost:3000`
- Server: `http://localhost:4000`
- PostgreSQL: `localhost:5432`

The server container runs Prisma migrations and the seed script on startup. The seed is skipped automatically when users already exist.

## Demo Accounts

- Admin: `admin` / `admin123`
- Teacher: `teacher` / `teacher123`
- Student: `student` / `student123`

## API Summary

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/auth/demo-accounts`
- `GET/POST/PUT/DELETE /api/users`
- `GET/POST/PUT/DELETE /api/classes`
- `GET/POST/PUT/DELETE /api/grades`
- `GET/POST/PUT/DELETE /api/schedule`
- `GET/POST/PUT/DELETE /api/projects`

## Notes

- The seeded data mirrors the original demo dataset used by the frontend.
- Admin CRUD actions now write to PostgreSQL instead of local React state.
- Teacher and student dashboards still behave like the original app, but their data now comes from the API.
