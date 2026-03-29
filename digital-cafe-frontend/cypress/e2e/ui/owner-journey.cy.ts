interface ApiEnvelope<T> {
  data: T;
}

const apiUrl = () =>
  (Cypress.env("apiUrl") as string) || "http://localhost:8080/api";

const nextDayDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
};

const loginUi = (email: string, password: string) => {
  cy.visit("/auth/login");
  cy.get("#email").clear().type(email);
  cy.get("#password").clear().type(password);
  cy.contains("button", "Sign In").click();
};

describe("Cafe owner UI journey", () => {
  it("loads cafe, menu, and staff management screens", () => {
    const suffix = `${Date.now()}`;
    const menuItemName = `UI Latte ${suffix}`;
    const staffEmail = `ui.waiter.${suffix}@example.com`;

    cy.apiLogin("owner@cafe.com", "Owner@123").then((token) => {
      cy.apiGet(token, "/cafes/my-cafes").then((cafesRes) => {
        const cafes = (cafesRes.body as ApiEnvelope<{ id: number }[]>)?.data ?? [];
        const cafeId = cafes[0].id;

        cy.wrap(menuItemName).as("menuItemName");
        cy.wrap(staffEmail).as("staffEmail");

        cy.apiPost(token, `/menu-items/cafe/${cafeId}`, {
          name: menuItemName,
          description: "Cypress UI menu item",
          price: 199,
          category: "MAIN_COURSE",
          isVegetarian: true,
          preparationTime: 15,
        }).then((menuRes) => {
          if (![200, 201].includes(menuRes.status)) {
            cy.apiGet(token, `/menu-items/cafe/${cafeId}`).then((itemsRes) => {
              const items = (itemsRes.body as ApiEnvelope<{ name: string }[]>)?.data ?? [];
              if (items.length > 0) {
                cy.wrap(items[0].name).as("menuItemName");
              }
            });
          } else {
            cy.wrap(menuItemName).as("menuItemName");
          }
        });

        cy.apiPost(token, "/staff", {
          username: `uiwaiter-${suffix}`,
          email: staffEmail,
          firstName: "UI",
          lastName: "Waiter",
          cafeId,
          role: "WAITER",
          joiningDate: nextDayDate(),
        }).then((staffRes) => {
          if (![200, 201].includes(staffRes.status)) {
            cy.apiGet(token, `/staff/cafe/${cafeId}`).then((staffList) => {
              const staff = (staffList.body as ApiEnvelope<{ email: string }[]>)?.data ?? [];
              if (staff.length > 0) {
                cy.wrap(staff[0].email).as("staffEmail");
              }
            });
          } else {
            cy.wrap(staffEmail).as("staffEmail");
          }
        });

        loginUi("owner@cafe.com", "Owner@123");
        cy.url().should("include", "/owner/dashboard");

        cy.visit("/owner/cafes");
        cy.contains("Café Management").should("exist");

        cy.visit(`/owner/menu?cafeId=${cafeId}`);
        cy.contains("Menu Management").should("exist");
        cy.get("@menuItemName").then((name) => {
          cy.contains(String(name), { timeout: 15000 }).should("exist");
        });

        cy.visit(`/owner/staff?cafeId=${cafeId}`);
        cy.contains("Staff Management").should("exist");
        cy.get("@staffEmail").then((email) => {
          cy.contains(String(email), { timeout: 15000 }).should("exist");
        });
      });
    });
  });
});
