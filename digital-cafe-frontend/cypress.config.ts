import { defineConfig } from 'cypress';

export default defineConfig({
  env: {
    apiUrl: 'http://localhost:8080/api',
    adminEmail: process.env.CYPRESS_ADMIN_EMAIL || 'cafehub.admin@gmail.com',
    adminPassword: process.env.CYPRESS_ADMIN_PASSWORD || '',
  },
  e2e: {
    baseUrl: 'http://localhost:4200',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    video: false,
  },
});
