/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      apiLogin(email: string, password: string): Chainable<string>;
      apiGet<T = any>(token: string, path: string): Chainable<Response<T>>;
      apiPost<T = any>(token: string, path: string, body?: any): Chainable<Response<T>>;
      apiPut<T = any>(token: string, path: string, body?: any): Chainable<Response<T>>;
      apiPatch<T = any>(token: string, path: string, body?: any): Chainable<Response<T>>;
    }
  }
}

const apiUrl = () => (Cypress.env('apiUrl') as string) || 'http://localhost:8080/api';

Cypress.Commands.add('apiLogin', (email: string, password: string) => {
  return cy
    .request({
      method: 'POST',
      url: `${apiUrl()}/auth/login`,
      body: { email, password },
      failOnStatusCode: false,
    })
    .then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('token');
      return response.body.token as string;
    });
});

Cypress.Commands.add('apiGet', (token: string, path: string) => {
  return cy.request({
    method: 'GET',
    url: `${apiUrl()}${path}`,
    headers: { Authorization: `Bearer ${token}` },
    failOnStatusCode: false,
  });
});

Cypress.Commands.add('apiPut', (token: string, path: string, body?: any) => {
  return cy.request({
    method: 'PUT',
    url: `${apiUrl()}${path}`,
    headers: { Authorization: `Bearer ${token}` },
    body: body ?? {},
    failOnStatusCode: false,
  });
});

Cypress.Commands.add('apiPost', (token: string, path: string, body?: any) => {
  return cy.request({
    method: 'POST',
    url: `${apiUrl()}${path}`,
    headers: { Authorization: `Bearer ${token}` },
    body: body ?? {},
    failOnStatusCode: false,
  });
});

Cypress.Commands.add('apiPatch', (token: string, path: string, body?: any) => {
  return cy.request({
    method: 'PATCH',
    url: `${apiUrl()}${path}`,
    headers: { Authorization: `Bearer ${token}` },
    body: body ?? {},
    failOnStatusCode: false,
  });
});

export {};
