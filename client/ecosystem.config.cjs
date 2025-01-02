module.exports = {
    apps: [
      {
        name: "frontend",
        script: "npx",
        args: "serve -s dist -l 5173",
        env: {
          NODE_ENV: "production"
        }
      }
    ]
  };
