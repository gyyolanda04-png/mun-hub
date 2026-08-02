# MUN Hub

- `frontend/` — Next.js/React (TSX) committee management UI.
- `backend/` — Spring Boot (Java) REST API. See `backend/README.md` for setup and API docs.

## Quick start

Run these in two separate terminals, then open http://localhost:3000.

```bash
# terminal 1 — backend (needs a Java 21+ JDK; Maven itself is not required)
cd backend
./mvnw spring-boot:run      # Windows: mvnw.cmd spring-boot:run

# terminal 2 — frontend (needs Node.js)
cd frontend
pnpm install
pnpm dev
```
