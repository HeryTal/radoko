<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
npm install
```

## PostgreSQL with Docker

Copy `.env.example` to `.env` and change `POSTGRES_PASSWORD` if desired. The
example password is only for local development; do not use it in production or
commit `.env`. `JWT_SECRET` must be a private random value of at least 32 bytes;
generate one locally and do not commit it.

```powershell
Copy-Item .env.example .env
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$bytes = New-Object byte[] 32
$rng.GetBytes($bytes)
$secret = [Convert]::ToBase64String($bytes)
$envLines = (Get-Content .env) -replace '^JWT_SECRET=.*$', "JWT_SECRET=$secret"
[System.IO.File]::WriteAllLines((Resolve-Path .env), $envLines, (New-Object System.Text.UTF8Encoding($false)))
$rng.Dispose()
npm run db:up
npm run db:deploy
npm run prisma:generate
```

The database runs on `localhost:5433` and keeps its data in the
`postgres_data` Docker volume. NestJS reads `DATABASE_URL` from `.env` and
connects to PostgreSQL through Prisma. The initial Prisma schema creates a
`User` table; edit `prisma/schema.prisma` and create a new migration whenever
the data model changes.

```bash
npm run start:dev
```

Useful database commands:

```bash
npm run db:logs
npm run db:studio
npm run db:down
```

## Register a user

Start the API with `npm run start:dev`, then send a JSON request:

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"person@example.com\",\"password\":\"correct horse battery staple\",\"name\":\"Person\"}"
```

Passwords must contain 12 to 128 characters. The API stores an Argon2id hash,
normalizes e-mail addresses to lowercase, and returns the created user's public
fields without the password hash.

## Professional profiles and appointment booking

Apply the profile, verification, and booking migrations with `npm run db:deploy`, then
regenerate the Prisma client with `npm run prisma:generate`. Profiles include
professional type, specialty, public practice/contact details, biography,
languages, services, indicative fee, consultation modes, and weekly
availability. E-mail and credentials are excluded from public profile responses.

Authenticated endpoints:

- `GET /auth/me` reads the complete private profile.
- `PATCH /auth/me/profile` edits public profile fields.
- `PATCH /auth/me/availability` replaces the weekly availability windows.
- `GET /auth/me/appointments` lists upcoming and recent appointments with their status.
- `PATCH /auth/me/appointments/:id/status` confirms, refuses, cancels, or completes a booking.
- `PATCH /auth/me/appointments/:id/reschedule` moves a future booking to another valid slot.
- `POST /auth/me/verification-document` accepts one private PDF/JPG/PNG credential (maximum 10 MiB).
- `DELETE /auth/me` deletes a professional account and anonymizes patient bookings made with that account's e-mail.

Public endpoints:

- `GET /auth/public?specialty=...&city=...` searches approved professional profiles.
- `GET /auth/public/:doctorId` reads an approved public profile.
- `GET /auth/public/:doctorId/slots?date=YYYY-MM-DD` returns booked local times.
- `POST /auth/public/:doctorId/appointments` reserves an open time. The request
  contains `startsAt` (ISO 8601), `patientName`, `patientEmail`, `patientPhone`,
  and an optional `reason`, plus required `privacyConsent: true`. Times use
  Madagascar's UTC+03:00 timezone. The API serializes booking transactions per
  professional and rejects overlapping active bookings.
- `POST /auth/public/appointments/cancel` cancels a future request using the
  single-use token emailed to the patient.
- `POST /auth/public/appointments/erase-data` immediately anonymizes appointments
  associated with the e-mail address proven by the secure privacy link.

  Profile photos are uploaded as multipart field `photo` to the authenticated
  `POST /auth/me/photo` endpoint. JPG, PNG, and WebP images up to 5 MiB are
  accepted. Files are stored in `UPLOAD_DIR` (defaults to `uploads/` under the
  backend working directory) and served from `/uploads/`; configure this directory
  on persistent storage for deployments where the application filesystem is
  ephemeral.

## Verification, notifications, and retention

New professional profiles remain private until an administrator approves a
submitted credential. Create an account normally, then promote that exact
account from a secured operator shell:

```powershell
npm run admin:promote -- admin@example.com
```

Do not expose administrator credentials or run this command from a public
endpoint. Sign in with that account and open `/admin` to review the private
documents, approve, or refuse with a reason. Documents are removed immediately
after a decision.

Configure SMTP before production startup. The backend requires all SMTP
settings when `NODE_ENV=production`; in development without SMTP, messages are
queued but remain undelivered and a warning is logged.

```dotenv
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=radoko@example.com
SMTP_PASS=your-secret-from-a-secret-manager
SMTP_FROM=Radoko <radoko@example.com>
```

The outbox retries transient delivery errors with backoff, up to 12 attempts.
Sent mail is discarded after 30 days; permanently failed or older unsent mail
is removed. Appointment contact details are anonymized 12 months after their
closed date. The background worker also closes appointments that have elapsed.

## Production operations

- `GET /health` performs a database query and returns HTTP 503 when PostgreSQL
  is unavailable.
- Global request throttling defaults to 100 requests per IP per minute; login
  is limited to 5/minute, registration to 3/minute, and public booking to
  10/minute. Set `TRUST_PROXY_HOPS` to the exact trusted reverse-proxy hop
  count (0–5), not to a client-controlled forwarded-header value.
- Configure `UPLOAD_DIR` on a persistent volume. Back up profile-photo storage
  as well as PostgreSQL; the application intentionally does not claim cloud
  object-storage durability.
- Create a compressed PostgreSQL backup from an operator machine with `pg_dump`
  installed and `DATABASE_URL` loaded from the secret store:

  ```powershell
  .\scripts\backup-postgres.ps1
  ```

  Store the output on encrypted storage with access restrictions and an
  off-site copy. This script does not encrypt backups itself. Define and test
  a restore runbook with `pg_restore` before production; periodically restore
  into an isolated database and verify profiles, schedules, appointments, and
  uploaded media.
- The privacy information at `/confidentialite` is explicitly a draft. Add the
  real operator identity, contact details, applicable legal bases, and any
  required Malagasy legal notices before opening the service to the public.

## Log in

Send the same e-mail and password to receive a signed JWT access token valid
for 15 minutes:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"person@example.com\",\"password\":\"correct horse battery staple\"}"
```

Use the access token to access the protected profile endpoint:

```bash
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Observability

In production applications, observability is essential for understanding how your system behaves, detecting issues early, and maintaining reliable performance.

[NestJS Observe](https://observe.nestjs.com) automatically instruments your NestJS application, giving you deep visibility into your system with minimal setup:

- **Distributed tracing:** Follow requests across services and understand how they flow through your system.
- **Waterfall analysis:** Visualize request execution and identify slow operations, bottlenecks, and unexpected delays.
- **Performance analysis:** Analyze application performance in real time and quickly pinpoint areas that need optimization.
- **Metrics:** Track key application and infrastructure metrics to understand system health and performance trends.
- **Logging:** Centralize and correlate logs with traces and other telemetry to make debugging easier.
- **Error tracking:** Detect errors quickly and investigate their root causes with the surrounding context.
- **SLA monitoring:** Track service-level objectives and identify when your application is approaching or exceeding defined thresholds.
- **Alarms and alerts:** Set up alerts for critical errors, performance degradation, SLA violations, and other anomalies so your team can react quickly.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Auto-instrument your application with [NestJS Observer](https://observer.nestjs.com). Distributed tracing, metrics, and logging made easy. Error tracking and performance monitoring for your NestJS applications.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
