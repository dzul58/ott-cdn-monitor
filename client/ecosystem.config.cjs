module.exports = {
    apps: [
      {
        name: "frontend",
        script: "node",
        args: "node_modules/vite/bin/vite.js preview --port 5173 --host 0.0.0.0",
        env: {
          NODE_ENV: "production"
        }
      }
    ]
};