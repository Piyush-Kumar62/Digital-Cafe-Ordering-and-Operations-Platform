/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    apiLogin(email: string, password: string): Chainable<string>;
    apiGet<T = any>(token: string, path: string): Chainable<Response<T>>;
    apiPost<T = any>(token: string, path: string, body?: any): Chainable<Response<T>>;
    apiPut<T = any>(token: string, path: string, body?: any): Chainable<Response<T>>;
    apiPatch<T = any>(token: string, path: string, body?: any): Chainable<Response<T>>;
  }
}
