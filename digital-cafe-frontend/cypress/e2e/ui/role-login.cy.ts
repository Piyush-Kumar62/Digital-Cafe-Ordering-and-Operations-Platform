const visitLogin = (email: string, password: string) => {
  cy.visit("/auth/login");
  cy.get("#email").clear().type(email);
  cy.get("#password").clear().type(password);
  cy.contains("button", "Sign In").click();
};

describe("Role login UI journeys", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it("logs in as Admin and lands on dashboard", () => {
    const adminEmail = (Cypress.env("adminEmail") as string) || "cafehub.admin@gmail.com";
    const adminPassword = (Cypress.env("adminPassword") as string) || "Admin@123";
    visitLogin(adminEmail, adminPassword);
    cy.url().should("include", "/admin/dashboard");
  });

  it("logs in as Cafe Owner and lands on dashboard", () => {
    visitLogin("owner@cafe.com", "Owner@123");
    cy.url().should("include", "/owner/dashboard");
  });

  it("logs in as Chef and lands on dashboard", () => {
    visitLogin("chef1.brew@demo.com", "Chef@123");
    cy.url().should("include", "/chef/dashboard");
  });

  it("logs in as Waiter and lands on dashboard", () => {
    visitLogin("waiter1.brew@demo.com", "Waiter@123");
    cy.url().should("include", "/waiter/dashboard");
  });

  it("logs in as Customer and lands on dashboard or profile completion", () => {
    visitLogin("customer1@demo.com", "Customer@123");
    cy.url().should("match", /\/customer\/(dashboard|complete-profile)/);
  });
});
