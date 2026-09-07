module.exports = {
  apps: [
    {
      name: "pm2-dashboard-backend",
      cwd: "apps/backend",
      script: "dist/apps/backend/src/main.js",
      env: { NODE_ENV: "production" },
    },
    {
      name: "pm2-dashboard-frontend",
      cwd: "apps/frontend",
      script: "serve",
      args: `-s dist -l ${process.env.FRONTEND_PORT || 3000}`,
      interpreter: "none",
    },
  ],
};
