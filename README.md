# PM2 Dashboard

A comprehensive dashboard for managing PM2 services with GitHub integration and environment management.

## Features

- **Service Management**: Start, stop, and restart PM2 services
- **GitHub Integration**: Pull code from your repositories
- **Environment Management**: Configure different environments (prod, dev, etc.) with separate env variables
- **Multi-Service Support**: Manage multiple services in one place

## Project Structure

This is a monorepo using Turborepo, containing:

- **Frontend**: React application for the dashboard
- **Backend**: NestJS API for PM2 management
- **Shared**: Common types and interfaces

## Prerequisites

- Node.js (v16 or higher)
- PM2 installed globally (`npm install -g pm2`)
- Git

## Getting Started

1. Clone the repository:
   ```
   git clone https://github.com/your-username/pm2-dashboard.git
   cd pm2-dashboard
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Open `http://localhost:3000` in your browser

## Configuration

1. Start the application and go to Settings
2. Set your GitHub token (with repo scope)
3. The application will save your configurations in a `config.json` file

## Adding a Service

1. Go to Services page and click "Add Service"
2. Select a GitHub repository
3. Configure the service settings:
   - Branch to pull
   - Path to the script
   - Starting arguments
4. Configure environment variables for different environments
5. Start your service

## Development

- Frontend: Located in `apps/frontend`
- Backend: Located in `apps/backend`
- Shared Types: Located in `packages/shared`

## License

MIT 