const loginUi = (email: string, password: string) => {
  cy.visit("/auth/login");
  cy.get("#email").clear().type(email);
  cy.get("#password").clear().type(password);
  cy.contains("button", "Sign In").click();
};

describe("Dashboard UI smoke checks", () => {
  it("customer dashboard loads key widgets", () => {
    loginUi("customer1@demo.com", "Customer@123");
    cy.url().should("include", "/customer/dashboard");
    cy.contains("Welcome back").should("exist");
    cy.contains("Recent Orders").should("exist");
  });

  it("owner dashboard loads KPIs", () => {
    loginUi("owner@cafe.com", "Owner@123");
    cy.url().should("include", "/owner/dashboard");
    cy.contains("Live overview").should("exist");
    cy.contains("Orders").should("exist");
  });

  it("chef dashboard loads sections", () => {
    loginUi("chef1.brew@demo.com", "Chef@123");
    cy.url().should("include", "/chef/dashboard");
    cy.contains("Pending Orders").should("exist");
    cy.contains("Now Preparing").should("exist");
  });

  it("waiter dashboard loads ready orders", () => {
    loginUi("waiter1.brew@demo.com", "Waiter@123");
    cy.url().should("include", "/waiter/dashboard");
    cy.contains("Ready Orders").should("exist");
  });
});
