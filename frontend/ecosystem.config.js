module.exports = {
    apps: [
      {
        name: "frontend",
        script: "serve",
        args: "-s dist -l 5173", // -s untuk serve static files, -l untuk menentukan port
        env: {
          NODE_ENV: "production",
        },
      },
    ],
  };
  