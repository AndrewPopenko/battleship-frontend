export const environment = {
  production: false,
  apiUrl: getBackendUrl(),
};

function getBackendUrl(): string {
  // If running locally, use localhost
  // If accessed from network, use host IP
  const hostname = window.location.hostname;

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }

  // Use host IP to access the backend
  return `http://${hostname}:3000`;
}
