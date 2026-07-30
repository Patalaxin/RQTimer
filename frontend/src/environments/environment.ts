export const environment = {
  production: false,
  url: 'http://localhost:3000',
  apiUrl: 'http://localhost:3000',
  staticUrl: 'http://localhost:3000/static/',
  // Локально фронт ходит на Nest напрямую, без nginx, срезающего префикс /api.
  socketPath: '/socket.io',
};
