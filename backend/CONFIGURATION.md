# Backend Configuration

The backend reads configuration from:

1. Runtime environment variables (`process.env`)
2. `.env*` files in `backend/` (fallbacks)

## Environments

Set `APP_ENV` to enable environment-specific defaults and validation:

- `development` (default)
- `test`
- `production`

## `.env` file loading

Files are loaded in this precedence order (later wins):

1. `.env`
2. `.env.<APP_ENV>`
3. `.env.local` (skipped when `APP_ENV=test`)
4. `.env.<APP_ENV>.local` (skipped when `APP_ENV=test`)

`process.env` always overrides values from files.

## Required variables (production)

When `APP_ENV=production`:

- `ALLOWED_ORIGINS` (comma-separated)
- `JWT_SECRET` (must not be `secret`)

## Hot-reloading

Set `CONFIG_WATCH=true` to reload config when `.env*` files change.

- Changes apply to consumers that call `getConfig()` at runtime (e.g. CORS origin checks).
- Some values (like `PORT`) are still read once at startup.

## Encrypted secrets (optional)

You can store encrypted values using `ENC(<base64>)` or `enc:<base64>`, and provide a key via:

- `CONFIG_ENCRYPTION_KEY` (preferred)
- `CONFIG_SECRET_KEY` (alias)

The code uses AES-256-GCM with a SHA-256 derived key. See `backend/src/config/secrets.js`.

## Database connection pooling (PgBouncer)

For production deployments running multiple Node.js instances, a connection pooler prevents connection exhaustion.

### Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Direct database URL (used for migrations and health checks) |
| `DATABASE_POOL_URL` | PgBouncer pooler URL. When set, Prisma uses this for all queries |

### PgBouncer setup

1. Configure PgBouncer in **transaction pooling** mode (`pool_mode = transaction`).
2. Set `DATABASE_POOL_URL` to the PgBouncer connection string, e.g.:
   ```
   DATABASE_POOL_URL=postgresql://user:password@pgbouncer:6432/future_remittance
   ```
3. The app automatically appends `?pgbouncer=true` to the pooler URL, which disables prepared statements — required for transaction pooling mode.
4. Keep `DATABASE_URL` pointing at the primary Postgres instance so migrations (`prisma migrate deploy`) bypass the pooler.

### PgBouncer configuration reference (`pgbouncer.ini`)

```ini
[databases]
future_remittance = host=postgres port=5432 dbname=future_remittance

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
server_reset_query =
```

> `server_reset_query` must be empty in transaction mode because connections are not owned by a single client between statements.

## Prisma query logging

| Variable | Behaviour |
|---|---|
| `APP_ENV=development` | Query logging always enabled |
| `PRISMA_QUERY_LOG=true` | Enables query logging in any environment (useful for debugging in staging/production) |

Query events are emitted at the `debug` log level and include the query text, bound parameters, and execution duration in milliseconds.

