<!-- Auto-generated guidance for AI coding agents working on QuickHelper -->
# QuickHelper — Copilot Instructions

Purpose: give AI agents the exact, actionable knowledge needed to be productive in this mono-repo (Java Spring Boot backend + React + Vite frontend).

- **Repo layout:** Backend is in `Backend/` (Maven, Java 17, Spring Boot). Frontend is in `Frontend/` (Vite + React + TypeScript).

- **Build & run (local, Windows examples):**
  - Backend: from `Backend/` run `.\mvnw.cmd clean package` then `.\mvnw.cmd spring-boot:run` (or `mvnw spring-boot:run` on Unix).
  - Frontend: from `Frontend/` run `npm install` then `npm run dev` (Vite default port: `3000`).

- **Database:** PostgreSQL (Flyway migrations present). Typical quick start:
  - `docker run --name quick-helper-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=quick_helper -p 5432:5432 -d postgres:15`
  - Configs: `Backend/src/main/resources/application.properties` (or env vars documented in top-level README).
  - Migrations live under `src/main/resources/db/migration` (Flyway dependency in `Backend/pom.xml`).

- **Auth & admin:** the first user registered becomes an admin — registration flow enforced by backend. Useful endpoints: `/api/auth/register`, `/api/auth/login`.

- **File uploads & media:** uploads are stored under project-level `uploads/` with subdirs `resumes` and `videos`. Cloudinary is used in the backend; required env vars (see README): `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

- **Env vars & secrets:** Backend supports `.env` via `spring-dotenv`. Key env var names shown in root README (e.g., `SPRING_DATASOURCE_URL`, `JWT_SECRET`). Frontend uses `VITE_API_BASE_URL`.

- **Frontend patterns:**
  - Service layer: `Frontend/src/services/*` — use these for HTTP and WebSocket calls (e.g., `authService.ts`, `websocketService.ts`).
  - Routing and protected routes: `Frontend/src/App.tsx`, `ProtectedRoute.tsx`, `AdminRoute.tsx`.
  - Styling: Tailwind + `src/styles/design-system.css`.

- **Backend patterns:**
  - Package layout: controllers in `controller/`, services in `service/`, DTOs in `dto/`, repositories in `repository/` (see `Backend/README.md` for tree).
  - Uses Lombok — ensure annotation processing is enabled in IDE/build (`pom.xml` includes the processor paths).
  - WebSocket endpoints + STOMP support (backend dependency) pair with `@stomp/stompjs` + `sockjs-client` in the frontend.

- **Common developer workflows:**
  - To reproduce backend-only issues: run backend with `.\mvnw.cmd spring-boot:run` and hit APIs from curl or Postman.
  - To debug end-to-end: run backend and frontend locally; set `VITE_API_BASE_URL=http://localhost:8080/api` in frontend env.
  - Tests: backend uses `mvn test`. Frontend currently provides linting: `npm run lint` (no test script present).

- **Conventions worth noting for code generation or edits:**
  - DTOs and Controllers follow explicit request/response DTO classes (modify DTOs when changing request shapes).
  - The backend enforces role logic via `UserRole`/`ServiceType` enums — prefer using these enums when updating business logic.
  - Database schema evolution is Flyway-driven — add migration scripts to `src/main/resources/db/migration` and follow existing naming.
  - File upload paths are filesystem-backed in dev; CI or staging may expect Cloudinary configuration.

- **Where to look for examples:**
  - API controller examples: `Backend/src/main/java/com/quickhelper/backend/controller/` (e.g., `AuthController.java`).
  - Frontend service examples: `Frontend/src/services/authService.ts`, `Frontend/src/services/websocketService.ts`.

- **Quick pitfalls to avoid:**
  - Don’t assume admin is a separate account — first registered user becomes admin.
  - When changing persistence model, add a Flyway migration rather than letting JPA auto-update in prod.
  - Lombok-generated methods mean some symbols may not appear in source — rely on compiled signatures for refactors.

If anything here is unclear or you want additional examples (e.g., sample Flyway migration, typical WebSocket message sequence), tell me which area to expand.
