import { defineConfig } from 'cypress';

export default defineConfig({
  env: {
    apiUrl: 'http://localhost:8080/api',
    adminEmail: 'cafehub.admin@gmail.com',
    adminPassword: 'Admin@123',
  },
  e2e: {
    baseUrl: 'http://localhost:4200',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    video: false,
  },
});
