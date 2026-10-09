# Frontend deployment on Render

This Docker Web Service serves the Vite build through Nginx. Browser requests to
`/api/*` are proxied to the backend so session cookies stay on the frontend origin.
The proxy supports booking-event streams without buffering. No Neon credentials
belong in this frontend service.

1. Push this frontend project to its own GitHub repository.
2. In Render choose **New > Web Service**, select the frontend repository, and
   choose the **Docker** runtime (or create a Blueprint from `render.yaml`).
3. Set `API_BACKEND_ORIGIN=https://YOUR_BACKEND.onrender.com` with no trailing
   slash or `/api` suffix. Use the existing backend's public HTTPS origin.
4. Set the frontend health check to `/healthz`. Render supplies `PORT`.
5. After Render assigns a frontend URL, add that exact HTTPS origin to the
   backend's `FRONTEND_ORIGINS`, preserving any other required origins. Redeploy
   the backend if Render does not do so automatically.
6. Open `/`, then `/admin`, and check login, booking creation, live updates, and logout.

For a local Docker check:

```powershell
docker build -t jongq-frontend:render .
docker run --rm -p 8083:8080 -e API_BACKEND_ORIGIN=http://host.docker.internal:8080 jongq-frontend:render
```

The local check uses a local HTTP backend; the deployed setup uses HTTPS.
The existing Vite dev proxy remains available for `npm run dev`.
