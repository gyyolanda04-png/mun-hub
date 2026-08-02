# MUN Hub Backend

A Spring Boot REST API for the MUN Hub committee management frontend
(`../frontend`). It mirrors the data model and actions from the frontend's
`lib/types.ts` and `lib/store.tsx` (which currently persist to
`localStorage`), so it can act as a drop-in server-side replacement.

## Stack

- Java 21, Spring Boot 3.3
- Spring Web, Spring Data JPA, Bean Validation
- H2 (file-based) for local dev, PostgreSQL for production

## Prerequisites

You only need a **Java 21+ JDK** installed. Maven itself is not required —
this project includes the Maven Wrapper (`mvnw` / `mvnw.cmd`), which
downloads the right Maven version automatically on first run.

## Running locally

```bash
cd backend
./mvnw spring-boot:run
```

On Windows (Command Prompt or PowerShell), use `mvnw.cmd` instead:

```bash
cd backend
mvnw.cmd spring-boot:run
```

The API starts on `http://localhost:8080`. Data is persisted to a local H2
file database at `backend/data/mun-hub.mv.db` (gitignored) — no setup
required. Browse it at `http://localhost:8080/h2-console` if needed
(JDBC URL: `jdbc:h2:file:./data/mun-hub`, user `sa`, empty password).

By default CORS allows `http://localhost:3000` (the Next.js dev server).
Override with the `FRONTEND_ORIGIN` env var (comma-separated for multiple
origins).

## Running against PostgreSQL (production)

Set `SPRING_PROFILES_ACTIVE=prod` plus:

- `DB_URL` — e.g. `jdbc:postgresql://host:5432/mun_hub`
- `DB_USERNAME`
- `DB_PASSWORD`
- `FRONTEND_ORIGIN` — your deployed frontend's origin

```bash
SPRING_PROFILES_ACTIVE=prod DB_URL=... DB_USERNAME=... DB_PASSWORD=... \
  ./mvnw spring-boot:run
```

Schema is auto-created/updated via Hibernate (`ddl-auto: update`). For a
real production deployment you'd typically swap this for a migration tool
like Flyway, but that's out of scope for now.

## API

All endpoints are under `/api/committees` and return/accept JSON shaped
exactly like the frontend's `Committee`, `Delegate`, and `DebateState`
types.

| Method | Path | Description |
|---|---|---|
| GET | `/api/committees` | List all committees, newest first |
| POST | `/api/committees` | Create a committee — `{ "name": string, "topic": string }` |
| GET | `/api/committees/{id}` | Get one committee |
| DELETE | `/api/committees/{id}` | Delete a committee |
| POST | `/api/committees/{id}/delegates` | Bulk-add delegates — `{ "delegates": [{ "delegation", "name", "school", "email", "attendance" }], "attendanceSessions": [...] }`. `delegation` (the country/delegation represented) is required and must be unique within the committee — inputs whose delegation already exists (in the committee or earlier in the same batch, case-insensitive) are silently skipped rather than duplicated. `attendanceSessions` is merged into the committee's session list (new names appended, duplicates ignored) |
| DELETE | `/api/committees/{id}/delegates/{delegateId}` | Remove a delegate (also clears them from the debate's current speaker / queue) |
| PATCH | `/api/committees/{id}/delegates/{delegateId}/counter` | Increment a counter — `{ "field": "speeches" \| "amendments" \| "pois", "delta": number }`. Applied as an atomic `UPDATE ... SET x = x + delta` at the database level (not a Java-side read-then-write), so it's safe under rapid/concurrent clicks — no increments get silently lost |
| PATCH | `/api/committees/{id}/debate` | Partially update debate state — send only the fields you want to change, e.g. `{ "stage": "general" }` or `{ "currentSpeakerId": null }` |
| PATCH | `/api/committees/{id}/delegates/{delegateId}/attendance` | Set one delegate's attendance for one session — `{ "session": "Day 1", "present": true }`. 404s if `session` isn't one of the committee's `attendanceSessions` |
| POST | `/api/committees/{id}/attendance-sessions` | Add a new attendance column — `{ "session": "Day 1" }`. No-op if it already exists |
| DELETE | `/api/committees/{id}/attendance-sessions/{session}` | Remove an attendance column (URL-encode `session`) and clear it from every delegate |

### Example

```bash
curl -X POST http://localhost:8080/api/committees \
  -H 'Content-Type: application/json' \
  -d '{"name":"UNSC","topic":"Nuclear Non-Proliferation"}'
```

### Committee JSON shape

```json
{
  "id": "uuid",
  "name": "UNSC",
  "topic": "Nuclear Non-Proliferation",
  "createdAt": 1234567890,
  "delegates": [
    {
      "id": "uuid",
      "delegation": "Bangladesh",
      "name": "Alice",
      "school": "Columbia",
      "email": "alice@x.com",
      "speeches": 0,
      "amendments": 0,
      "pois": 0,
      "attendance": { "Day 1": true, "Day 2- Morning": false }
    }
  ],
  "debate": {
    "totalDuration": 180,
    "resolutions": 2,
    "openingCeremony": 15,
    "closingCeremony": 15,
    "amendmentsPerResolution": 3,
    "stage": "opening",
    "currentResolution": 1,
    "currentAmendment": 1,
    "currentSpeakerId": null,
    "speakerQueue": []
  },
  "attendanceSessions": ["Day 1", "Day 2- Morning"]
}
```

### `id` vs `delegation`

Each delegate has both an `id` (a server-generated UUID) and a `delegation`
(the country/committee seat they represent, e.g. `"Bangladesh"`). `id`
stays the technical primary key — it's what `DebateState.currentSpeakerId`
and `speakerQueue` reference, and those references aren't scoped to a
committee, so they need to stay globally unique. `delegation` is the
natural/business key: a committee can't have two delegates representing the
same country, so it's enforced unique per committee and is how delegates
are identified throughout the UI (in place of their name).

## Connecting the frontend

`frontend/lib/store.tsx` already talks to this API via `frontend/lib/api.ts`,
using `NEXT_PUBLIC_API_URL` (defaulting to `http://localhost:8080`, see
`frontend/.env.local.example`). Just run this backend and the frontend dev
server side by side.
