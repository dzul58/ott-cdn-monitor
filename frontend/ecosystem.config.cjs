module.exports = {
  apps: [
    {
      name: "frontend",
      script: "npm",
      args: "run preview",
      interpreter: "none",
      env: {
        NODE_ENV: "production",
        HOST: "0.0.0.0",
        PORT: 5173,
      },
    },
  ],
};
