# Innmotek V2 — Post-Launch Technical Debt & Infrastructure Maintenance

## 1. Free-Tier Infrastructure Keep-Alive & Auto-Pause Safeguards

### Background & Risk Analysis
The production staging stack is hosted across two free-tier cloud platforms:
1. **Render (Free Tier Backend)**: Spins down / sleeps the Node.js Express service after 15 minutes of inbound HTTP inactivity. Cold starts take 30–50 seconds.
2. **Supabase (Free Tier Database)**: Automatically pauses PostgreSQL databases after 7 consecutive days of query inactivity. A paused database causes the backend connection pool to fail, crashing API services upon subsequent requests.

---

### Keep-Alive Solution Architecture

To eliminate both risks with zero cost, the backend exposes a dedicated, unauthenticated, lightweight database-pinging health endpoint:
- **Direct Path**: `https://innmotek-backend.onrender.com/health`
- **API Alias**: `https://innmotek-backend.onrender.com/api/health`

#### Database Query Executed:
```sql
SELECT NOW() as db_time, 1 as active;
```

#### Response Format:
- **HTTP 200 (Healthy)**:
  ```json
  {
    "result": "success",
    "service": "innmotek-backend-v2",
    "status": "healthy",
    "database": {
      "status": "connected",
      "provider": "Supabase PostgreSQL",
      "db_time": "2026-09-01T11:52:00.790Z",
      "latency_ms": 42
    },
    "timestamp": "2026-09-01T11:52:07.140Z"
  }
  ```
- **HTTP 503 (Unhealthy / Outage)**: Returned if PostgreSQL is unreachable, allowing external monitors to alert instantly.

---

### Critical Operational Requirement: Uptime Monitoring

An external uptime monitor (e.g., **UptimeRobot**, **Better Uptime**, or **Cron-Job.org**) **MUST** remain active:

| Setting | Value |
| :--- | :--- |
| **Monitor Type** | HTTP(s) |
| **Target URL** | `https://innmotek-backend.onrender.com/health` |
| **Monitoring Interval** | `5 minutes` *(covers both Render's 15-min sleep and Supabase's 7-day auto-pause)* |
| **Accepted Status Codes** | `200` |

> ⚠️ **CRITICAL WARNING**:
> If the UptimeRobot monitor is ever disabled, paused, deleted, or repointed to an invalid URL:
> 1. Render will begin sleeping after 15 minutes of inactivity, introducing 30–50 second cold-start delays.
> 2. Supabase PostgreSQL will automatically pause after 7 days of inactivity.
> 3. The backend connection pool will fail to connect on the next restart, causing a complete API outage until manually unpaused via the Supabase dashboard.

---

## 2. Infrastructure Upgrade Recommendations (For Future Scale)
When moving from staging to commercial production:
- Upgrade Render to **Starter / Standard** tier (persists 24/7 without sleep).
- Upgrade Supabase to **Pro Tier** (disables auto-pause and provides automated daily backups + point-in-time recovery).
