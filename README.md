# Family Planning App

Family Planning App is a React and TypeScript household budget tracker for recording expenses, income, recurring plans, budgets, reminders, and member-level monthly summaries.

## Features

- Track one-time expenses and income by household member
- Create recurring expenses or income with pause and skip controls
- Review monthly budget usage by category
- Export filtered monthly activity to CSV
- Get reminder and notification support for upcoming items
- Switch between separate local user profiles

## Local Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
```

The production build output is generated in `dist/`.

## GitHub Pages Deployment

This repository is configured to deploy to GitHub Pages from GitHub Actions.

Expected site URL:

`https://apongpo.github.io/Family-planning/`

To enable Pages in the repository:

1. Open the repository on GitHub.
2. Go to `Settings` > `Pages`.
3. Under `Build and deployment`, choose `GitHub Actions` as the source.
4. Push to `main` and wait for the `Deploy to GitHub Pages` workflow to finish.

## Notes

- App data is stored in the browser with `localStorage`.
- Notifications and alarm sound depend on browser support and permission settings.
