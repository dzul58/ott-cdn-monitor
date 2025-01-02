module.exports = {
    apps: [
      {
        name: "ma-nisa-fe",
        script: "npx",
        args: "serve -s dist -l 5173",
        env: {
          NODE_ENV: "production"
        }
      }
    ]
  };
