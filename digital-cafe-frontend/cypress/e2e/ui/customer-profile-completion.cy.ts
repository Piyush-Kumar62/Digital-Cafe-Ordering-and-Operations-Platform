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

describe("Customer profile completion UI", () => {
  it("completes required profile fields and redirects", () => {
    const suffix = `${Date.now()}`;
    const email = `ui.profile.${suffix}@example.com`;
    const password = "Customer@123";

    cy.request({
      method: "POST",
      url: `${apiUrl()}/auth/simple-register`,
      body: {
        username: `uiprofile-${suffix}`,
        email,
        password: "Temp@123",
        firstName: "UI",
        lastName: "Profile",
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
    cy.url().should("include", "/customer/complete-profile");

    cy.get('[data-testid="profile-first-name"]').clear().type("Piyush");
    cy.get('[data-testid="profile-last-name"]').clear().type("Kumar");
    cy.get('[data-testid="profile-dob"]').type("1998-01-01");
    cy.get('[data-testid="profile-gender"]').select("MALE");
    cy.get('[data-testid="profile-phone"]').clear().type("9876543210");

    cy.get("#pincode").clear().type("560001");
    cy.get("#street").clear().type("MG Road");

    cy.get("#city").invoke("val").then((val) => {
      if (!val) {
        cy.get("#city").type("Bengaluru", { force: true });
      }
    });
    cy.get("#state").invoke("val").then((val) => {
      if (!val) {
        cy.get("#state").type("Karnataka", { force: true });
      }
    });

    cy.get('[data-testid="profile-institution"]').clear().type("Test Institute");
    cy.get("body").then(($body) => {
      if ($body.find('[data-testid="profile-institution-use-typed"]').length) {
        cy.get('[data-testid="profile-institution-use-typed"]').click();
      }
    });

    cy.get('[data-testid="profile-degree"]').find("option").eq(1).then((opt) => {
      cy.get('[data-testid="profile-degree"]').select(opt.val() as string);
    });

    cy.get('[data-testid="profile-branch"]').then(($el) => {
      const tag = $el.prop("tagName");
      if (tag === "SELECT") {
        cy.wrap($el).find("option").eq(1).then((opt) => {
          cy.wrap($el).select(opt.val() as string);
        });
      } else {
        cy.wrap($el).clear().type("General");
      }
    });

    cy.get('[data-testid="profile-passing-year"]').find("option").eq(1).then((opt) => {
      cy.get('[data-testid="profile-passing-year"]').select(opt.val() as string);
    });

    cy.get('[data-testid="profile-score"]').clear().type("8.2");

    cy.get('[data-testid="profile-submit"]').click();
    cy.url().should("not.include", "/customer/complete-profile");
  });
});
