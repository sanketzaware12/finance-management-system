// ─────────────────────────────────────────────────────────────
// Finora frontend configuration
// This file exists so you NEVER have to edit app.js just to
// point the UI at a different backend URL/port.
// ─────────────────────────────────────────────────────────────
window.APP_CONFIG = {
  // Base URL of your Spring Boot backend's REST API.
  // Default matches `server.port=8080` from application.properties.
  // If you deploy the backend elsewhere, change ONLY this line.
  API_BASE_URL: 'http://localhost:8080/api'
};
