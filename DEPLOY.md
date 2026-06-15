# IntelliHire — Deployment & CI/CD

## Architecture
- **Frontend**: React (Vite) built into static files, served by an **nginx** container (also terminates TLS and reverse-proxies `/api` + `/uploads`).
- **Backend**: Flask + gunicorn in a **Docker** container.
- **Database**: **PostgreSQL** container with a persistent named volume (`pgdata`).
- **Uploads**: bind-mounted host dir `/opt/intellihire/uploads` (persists across deploys).
- **TLS**: Let's Encrypt cert mounted read-only into the web container; renewals via the `certbot-www` webroot.
- Orchestrated by `docker compose` on the EC2 host (`/opt/intellihire`).

## CI/CD (GitHub Actions → GHCR → EC2)
On every push to `main` (`.github/workflows/deploy.yml`):
1. Build & push `intellihire-backend` and `intellihire-web` images to **GHCR** (`ghcr.io/fakiha214/...`).
2. SSH into EC2, `docker compose pull && up -d`, and seed the DB only if empty.

### Required GitHub repo secrets
| Secret | Value |
|---|---|
| `EC2_HOST` | `3.218.171.77` |
| `EC2_USER` | `ubuntu` |
| `EC2_SSH_KEY` | full contents of `aws-creds/intellihire-key.pem` |

(GHCR auth uses the built-in `GITHUB_TOKEN` — no extra secret needed.)

## Host layout (`/opt/intellihire`)
```
docker-compose.yml      # from deploy/docker-compose.yml
.env                    # secrets: DATABASE_URL, POSTGRES_PASSWORD, SECRET_KEY, STRIPE_*, OPENROUTER_API_KEY, FRONTEND_URL
uploads/                # bind-mounted user uploads
certbot-www/            # ACME webroot for cert renewal
```

## Manual operations
```bash
# on the host
cd /opt/intellihire
docker compose ps
docker compose logs -f backend
docker compose run --rm backend python seed.py      # reseed demo data
docker compose restart web                            # reload nginx (after cert renewal)
```
