# Shopping Server

Backend API for a small marketplace. Users sign up, list products with images, and buy them through Stripe Checkout. A Stripe webhook marks a product as sold, and connected clients get the update in real time over Server-Sent Events.

This is the server half of a Next.js + NestJS shopping app.

## Features

- **Authentication**: email/password sign-up with Argon2 password hashing, and JWT login stored in an HTTP-only `Authentication` cookie.
- **Products**: create, list and view products, and upload a product image (JPEG, PNG or WebP, up to 10 MB). Images are served statically from `/products`.
- **Checkout**: creates a Stripe Checkout session for a product.
- **Stripe webhooks**: the endpoint verifies the Stripe signature against the raw request body, then queues the event in BullMQ (Redis). A worker marks the product as sold once payment completes.
- **Real-time updates**: product events are streamed to clients over SSE.
- **Validation**: request DTOs are validated with Zod schemas through a custom pipe.
- **Logging**: structured request logging with Pino (pretty-printed outside production).

## Tech stack

| Area           | Technology                                                    |
| -------------- | ------------------------------------------------------------- |
| Runtime        | Node.js, TypeScript                                           |
| Framework      | NestJS 11 (Express)                                           |
| Database       | PostgreSQL 18                                                 |
| ORM            | Prisma 7 (`prisma-client` generator, `@prisma/adapter-pg`)    |
| Auth           | `@nestjs/jwt`, Argon2, `cookie-parser`                        |
| Payments       | Stripe                                                        |
| Job queue      | BullMQ + Redis 8 (`@nestjs/bullmq`)                           |
| Validation     | Zod 4                                                         |
| Logging        | Pino (`nestjs-pino`, `pino-pretty`)                           |
| Static files   | `@nestjs/serve-static`                                        |
| Testing        | Jest, Supertest                                               |
| Tooling        | pnpm, ESLint, Prettier                                        |
| Infrastructure | Podman/Docker Compose (PostgreSQL, pgAdmin, Redis)            |

## API overview

| Method | Path                           | Auth | Description                          |
| ------ | ------------------------------ | ---- | ------------------------------------ |
| POST   | `/users`                       | –    | Register a new user                  |
| GET    | `/users/me`                    | JWT  | Get the current user                 |
| POST   | `/auth/login`                  | –    | Log in and set the auth cookie       |
| POST   | `/products`                    | JWT  | Create a product                     |
| GET    | `/products`                    | JWT  | List products                        |
| GET    | `/products/:productId`         | JWT  | Get a single product                 |
| POST   | `/products/:productId/image`   | JWT  | Upload a product image               |
| SSE    | `/products/events`             | JWT  | Stream product events                |
| POST   | `/checkout/session`            | JWT  | Create a Stripe Checkout session     |
| POST   | `/checkout/webhook`            | –    | Stripe webhook (signature-verified)  |

Example requests are in [`src/request.http`](src/request.http).

## Project structure

```
src/
├── auth/        # login, JWT guard, @CurrentUser decorator
├── users/       # registration and current user
├── products/    # products CRUD, image upload, SSE events
├── checkout/    # Stripe sessions, webhook, BullMQ processor
├── prisma/      # PrismaService
├── common/      # shared pipes (Zod validation, ID parsing)
├── dtos/        # Zod schemas / DTOs
└── constants/
prisma/
├── schema.prisma
└── migrations/
```

## Getting started

### Prerequisites

- Node.js and pnpm
- Podman (or Docker) with Compose
- A Stripe account (test mode) and the Stripe CLI for forwarding webhooks locally

### Environment variables

The app loads `.env.<NODE_ENV>` (e.g. `.env.development`, `.env.test`), or `.env` in production.

| Variable                   | Description                                    |
| -------------------------- | ---------------------------------------------- |
| `PORT`                     | HTTP port (default `3001`)                     |
| `CLIENT_URL`               | Frontend origin allowed by CORS                |
| `DATABASE_URL`             | PostgreSQL connection string                   |
| `JWT_SECRET`               | Secret used to sign JWTs                       |
| `JWT_EXPIRATION_MS`        | Token/cookie lifetime in milliseconds          |
| `REDIS_HOST`, `REDIS_PORT` | Redis connection for BullMQ                    |
| `STRIPE_SECRET_KEY`        | Stripe API secret key                          |
| `STRIPE_WEBHOOK_SECRET`    | Signing secret for the webhook endpoint        |
| `STRIPE_SUCCESS_URL`       | Redirect after successful payment              |
| `STRIPE_CANCEL_URL`        | Redirect after cancelled payment               |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT` | Compose: PostgreSQL container |
| `PGADMIN_DEFAULT_EMAIL`, `PGADMIN_DEFAULT_PASSWORD`, `PGADMIN_PORT`  | Compose: pgAdmin container    |

### Run locally

```bash
# install dependencies
pnpm install

# start PostgreSQL, pgAdmin and Redis
pnpm db:up

# apply migrations and generate the Prisma client
pnpm db:migrate
pnpm db:generate

# start the API in watch mode
pnpm start:dev

# forward Stripe webhooks to the local server (separate terminal)
stripe listen --forward-to localhost:3001/checkout/webhook
```

Stop the containers with `pnpm db:down`.

## Scripts

| Script            | Description                          |
| ----------------- | ------------------------------------ |
| `pnpm start:dev`  | Start in watch mode                  |
| `pnpm start:prod` | Run the compiled build               |
| `pnpm build`      | Compile to `dist/`                   |
| `pnpm test`       | Unit tests                           |
| `pnpm test:e2e`   | End-to-end tests                     |
| `pnpm test:cov`   | Test coverage                        |
| `pnpm lint`       | Lint and auto-fix                    |
| `pnpm format`     | Format with Prettier                 |
| `pnpm db:up`      | Start Compose services               |
| `pnpm db:down`    | Stop Compose services                |
| `pnpm db:migrate` | Run Prisma migrations (dev)          |
| `pnpm db:generate`| Generate the Prisma client           |
