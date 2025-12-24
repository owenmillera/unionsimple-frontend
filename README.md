# Union Simple Frontend

React Router v7 Framework Mode application.

## Development

```bash
npm install
npm run dev
```

## Building

```bash
npm run build
npm start
```

## Framework Mode Features

- Server-side rendering (SSR) enabled by default
- Export `loader` functions for data fetching (runs on server)
- Export `action` functions for mutations (runs on server)
- Use `new Response(JSON.stringify(data), {headers:{'Content-Type':'application/json'}})` for responses
- Use `<Form method="post">` for mutations
- Use `<Link>` for navigation
- Loaders auto-revalidate after actions

