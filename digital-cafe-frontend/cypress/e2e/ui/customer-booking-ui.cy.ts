const loginUi = (email: string, password: string) => {
  cy.visit("/auth/login");
  cy.get("#email").clear().type(email);
  cy.get("#password").clear().type(password);
  cy.contains("button", "Sign In").click();
};

describe("Customer booking + order UI flow", () => {
  it("books a table, adds to cart, and pays from UI", () => {
    loginUi("customer1@demo.com", "Customer@123");
    cy.url().should("include", "/customer/dashboard");

    cy.visit("/customer/browse-cafes");
    cy.get('[data-testid^="cafe-card-"]').first().click();
    cy.url().should("match", /\/customer\/browse-cafes\/\d+/);

    cy.get('[data-testid="go-to-booking"]').click();

    cy.get('[data-testid="booking-date-dropdown"]').click();
    cy.get('[data-testid^="booking-date-option-"]').first().click();

    cy.get('[data-testid="booking-guests-dropdown"]').click();
    cy.get('[data-testid^="booking-guest-option-"]').contains("2 guests").click();

    cy.get('[data-testid="booking-period-dropdown"]').click();
    cy.get('[data-testid^="booking-period-option-"]').first().click();

    cy.get('[data-testid^="booking-time-option-"]', { timeout: 15000 })
      .first()
      .click();

    cy.get('[data-testid^="table-option-"]', { timeout: 15000 })
      .first()
      .click();

    cy.get('[data-testid="confirm-booking"]').click();

    cy.get('[data-testid^="add-to-cart-"]', { timeout: 15000 })
      .first()
      .click();

    cy.get('[data-testid="pay-and-place"]').click();

    cy.url({ timeout: 30000 }).should("include", "/customer/order-tracking");
  });
});
