module.exports = {
  apps: [
    {
      name: "frontend",
      script: "vite",
      interpreter: "node",
      env: {
        NODE_ENV: "development",
        HOST: "0.0.0.0",
        PORT: 5173,
      },
      env_production: {
        NODE_ENV: "production",
        HOST: "0.0.0.0",
        PORT: 5173,
      },
    },
  ],
};
