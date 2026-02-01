# Whist Game - Angular Web Application

Angular web application for the Whist card game scoring system.

## Prerequisites

- Node.js 18+ (you have v20.19.5 ✓)
- npm or yarn

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm start
# Or: ng serve
```

The app will be available at `http://localhost:4200`

## Development

### Available Commands

```bash
# Start development server with hot reload
npm start
# Or: ng serve

# Build for production
npm run build

# Run tests
npm test
```

### Environment Configuration

Edit `src/environments/environment.ts` to configure API URL:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api/v1'
};
```

## Project Structure

```
src/
├── app/
│   ├── core/              # Core services and models
│   │   ├── services/     # API and game services
│   │   └── models/       # TypeScript interfaces
│   ├── features/         # Feature modules
│   │   ├── home/        # Home screen
│   │   └── game/        # Game components
│   └── shared/          # Shared UI components
└── styles/              # Global styles and theme
```

## Features

- Hebrew RTL support
- Dark theme with orange accents
- Responsive design
- Game state management with RxJS
- API integration with error handling

## Troubleshooting

### Port already in use
If port 4200 is in use:
```bash
ng serve --port 4201
```

### API Connection Issues
Make sure the backend is running on `http://localhost:8000`:
```bash
cd ../backend
uv run uvicorn app.main:app --reload
```
