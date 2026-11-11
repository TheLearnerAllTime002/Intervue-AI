# Local backend services

From the repository root, run `npm run dev`. This creates only missing `.env`
files, starts MongoDB and Redis with Docker Compose, and starts the frontend,
gateway, and all backend services. Existing `.env` files are never overwritten.

Before the first run, fill in the credentials marked as placeholders in the
generated service environment files. Firebase credentials are required for
authentication, GROQ is required by the AI services, and Razorpay credentials
are required for billing.

The local services use MongoDB at `127.0.0.1:27017` and Redis at `127.0.0.1:6380`.
Start both dependencies from the repository root:

```powershell
docker compose -f backend/docker-compose.yml up -d mongodb redis
```

Set these values in each service's local `.env` file:

```dotenv
MONGODB_URL=mongodb://127.0.0.1:27017/intervue_service
REDIS_URL=redis://127.0.0.1:6380
```

Compose publishes Redis on port `6380` to avoid conflicts with another local
Redis server.

For Billing, set `AUTH_MONGODB_URL` to the same database used by Auth so purchased
coins update the signed-in account:

```dotenv
AUTH_MONGODB_URL=mongodb://127.0.0.1:27017/intervue_service
```

Keep the gateway URLs and service ports aligned: Auth 8001, Resume 8002,
Interview 8003, Roadmap 8004, Billing 8005, and Gateway 8000. Start each Node
service from its own directory after MongoDB and Redis report healthy. Services
now wait for MongoDB before opening their HTTP port.

The MongoDB data is stored in the `mongodb_data` Docker volume. The database
port is bound to loopback for local development and has no MongoDB credentials
configured; do not expose it to a public network.
