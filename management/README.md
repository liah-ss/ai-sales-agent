# ExampleCorp Management

Enterprise internal management system for ExampleCorp.

This application is intentionally separated from the public website in `frontend/`.

## Local Commands

```bash
npm install
npm run dev
npm run build
```

Default local URL:

```text
http://127.0.0.1:5174/
```

## Boundary

- `frontend/`: public B2B website for external visitors.
- `management/`: internal enterprise management system for employees.
- `backend/`: shared FastAPI service and database.

Internal management APIs should use the `/api/management/*` namespace.
