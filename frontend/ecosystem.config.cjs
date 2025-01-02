module.exports = {
  apps: [
    {
      name: "frontend",
      script: "serve",
      args: "-s dist -l 5173", // -s untuk static files, -l untuk port
      interpreter: "none",
      env: {
        NODE_ENV: "production",
        HOST: "0.0.0.0",
        PORT: 5173,
      },
    },
  ],
};
