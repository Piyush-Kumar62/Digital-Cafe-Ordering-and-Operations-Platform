describe('Customer onboarding and dashboard flow', () => {
  it('navigates register -> login -> dashboard route shells', () => {
    cy.visit('/auth/register');
    cy.url().should('include', '/auth/register');

    cy.visit('/auth/login');
    cy.url().should('include', '/auth/login');

    cy.visit('/customer/dashboard');
    cy.url().should('include', '/auth/login');
  });
});
