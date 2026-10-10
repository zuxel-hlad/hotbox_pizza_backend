# HotBox Pizza API

REST API for the HotBox Pizza delivery service: pizza catalog with extra ingredients, user accounts with favorites, JWT authentication with password reset by email, and orders.

## Tech stack

- [NestJS 12](https://docs.nestjs.com) (Express), TypeScript 6
- PostgreSQL + [TypeORM 1.x](https://typeorm.io) with migrations
- class-validator, Swagger (OpenAPI)
- Nodemailer (Gmail SMTP) for OTP emails
- Jest + Supertest, ESLint + Prettier, Husky + lint-staged

## Features

- **Auth**: register, login, refresh token renewal, password change and reset via email OTP
- **Users**: profile, update, favorite pizzas
- **Pizzas**: CRUD, filtering and pagination
- **Extra ingredients**: CRUD
- **Orders**: create, list with filters, payment (stub)

## Getting started

### Prerequisites

- Node.js >= 24.9 (see `.nvmrc`), npm >= 10
- Docker (for PostgreSQL)

### Installation

```bash
git clone git@github.com:zuxel-hlad/hotbox_pizza_backend.git
cd hotbox_pizza_backend
nvm use
npm install
```

### Database

Start PostgreSQL in a container named `postgres` with the credentials from `src/core/database/database.config.ts`:

```bash
docker run -d --name postgres -p 5432:5432 \
  -e POSTGRES_USER=hotbox_pizza_admin \
  -e POSTGRES_PASSWORD=12345678 \
  -e POSTGRES_DB=hotbox_pizza \
  postgres:17
```

Apply migrations:

```bash
npm run db:migrate
```

### Environment variables

Copy `.env.example` to `.env` and fill in:

| Variable              | Description                                                             |
| --------------------- | ----------------------------------------------------------------------- |
| `USER_EMAIL`          | Gmail address used to send OTP emails                                   |
| `USER_EMAIL_PASSWORD` | Gmail [app password](https://support.google.com/accounts/answer/185833) |

Database connection and JWT secrets are currently hard-coded in `src/core/database/database.config.ts` and `src/core/config/jwt.config.ts`.

### Run

```bash
npm run dev          # watch mode
npm run build        # compile to dist/
npm run start:prod   # run compiled build
```

The API listens on `http://localhost:3000`.

## API documentation

Swagger UI is available at [`http://localhost:3000/docs`](http://localhost:3000/docs).

Protected routes expect the header:

```
Authorization: Token <jwt>
```

## Scripts

| Script                        | Description                                 |
| ----------------------------- | ------------------------------------------- |
| `npm run dev`                 | Start in watch mode                         |
| `npm run build`               | Build to `dist/`                            |
| `npm run start:prod`          | Run the compiled app                        |
| `npm run lint`                | ESLint with autofix                         |
| `npm run format`              | Prettier (also sorts imports)               |
| `npm test`                    | Unit tests                                  |
| `npm run test:e2e`            | E2E tests                                   |
| `npm run test:cov`            | Unit tests with coverage                    |
| `npm run db:create -- <path>` | Generate a migration from entity changes    |
| `npm run db:migrate`          | Apply pending migrations                    |
| `npm run db:drop`             | Drop the database schema                    |
| `npm run psql`                | Open `psql` inside the `postgres` container |

Generate a migration after changing an entity:

```bash
npm run db:create -- src/core/database/migrations/AddSomethingToOrder
```

## Project structure

```
src/
  main.ts, app.module.ts   bootstrap, Swagger, global exception filter
  common/                  shared decorators, DTOs, filters, helpers, types
  core/                    infrastructure: config, database, guards, middleware
    database/migrations/   TypeORM migrations
  modules/                 feature modules
    auth/ token/ user/ mail/ pizza/ extra-ingredient/ order/
test/                      unit and e2e tests
```

Each feature module follows the same layout (see `src/modules/order/`): module, controller, service, entity, `dto/`, `types/`.

## Development

- Branches: `feature/*`, `fix/*`, `chore/*`, `refactor/*`; pull requests go to `main`.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org): `feat(order): add order CRUD`.
- The pre-commit hook runs ESLint and Prettier on staged files.
- Schema changes go through migrations only (`synchronize` is disabled); never edit applied migrations.
- Before opening a PR run `npx tsc --noEmit`, `npm run lint` and the tests.

Detailed coding conventions are in [AGENTS.md](AGENTS.md).

## License

Private project, not licensed for redistribution.
