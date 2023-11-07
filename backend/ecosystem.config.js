module.exports = {
  apps: [
    {
      name: 'main',
      script: 'dist/main.js',
      env: {
        NODE_ENV: 'production',
      },
      env_file: '.env',
    },
  ],
};