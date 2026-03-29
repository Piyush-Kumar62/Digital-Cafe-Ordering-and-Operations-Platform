interface TokenResponse {
  token: string;
}

const apiUrl = () =>
  (Cypress.env("apiUrl") as string) || "http://localhost:8080/api";

const loginUi = (email: string, password: string) => {
  cy.visit("/auth/login");
  cy.get("#email").clear().type(email);
  cy.get("#password").clear().type(password);
  cy.contains("button", "Sign In").click();
};

describe("Customer onboarding UI flow", () => {
  it("verifies email via UI and logs in", () => {
    const suffix = `${Date.now()}`;
    const email = `ui.customer.${suffix}@example.com`;
    const password = "Customer@123";

    cy.request({
      method: "POST",
      url: `${apiUrl()}/auth/simple-register`,
      body: {
        username: `uicustomer-${suffix}`,
        email,
        password: "Temp@123",
        firstName: "UI",
        lastName: "Customer",
      },
    }).its("status").should("eq", 201);

    cy.request(`${apiUrl()}/public/e2e/email-token?email=${encodeURIComponent(email)}`)
      .its("body")
      .then((body: TokenResponse) => {
        cy.visit(`/auth/verify-email?token=${body.token}`);
        cy.contains("Email Verified").should("exist");
      });

    cy.request("POST", `${apiUrl()}/auth/forgot-password?email=${encodeURIComponent(email)}`)
      .its("status")
      .should("eq", 200);

    cy.request(`${apiUrl()}/public/e2e/password-reset-token?email=${encodeURIComponent(email)}`)
      .its("body")
      .then((body: TokenResponse) => {
        cy.request({
          method: "POST",
          url: `${apiUrl()}/auth/reset-password?token=${encodeURIComponent(body.token)}`,
          body: { newPassword: password, confirmPassword: password },
        }).its("status").should("eq", 200);
      });

    loginUi(email, password);
    cy.url().should("match", /\/customer\/(dashboard|complete-profile)/);
  });
});
