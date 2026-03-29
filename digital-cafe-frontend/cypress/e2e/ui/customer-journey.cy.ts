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

describe("Customer UI journey", () => {
  it("logs in and tracks a newly created order", () => {
    cy.apiLogin("customer1@demo.com", "Customer@123").then((token) => {
      cy.request(`${apiUrl()}/public/cafes?page=0&size=1`)
        .its("body")
        .then((body: ApiEnvelope<{ content: { id: number }[] }>) => {
          const cafeId = body.data.content[0].id;
          cy.request(`${apiUrl()}/public/cafes/${cafeId}`)
            .its("body")
            .then((detail: ApiEnvelope<{ menuItems: { id: number }[] }>) => {
              const menuItemId = detail.data.menuItems[0].id;

              cy.request({
                method: "GET",
                url: `${apiUrl()}/tables/available`,
                qs: {
                  cafeId,
                  date: nextDayDate(),
                  time: "19:00:00",
                  seats: 2,
                },
                headers: { Authorization: `Bearer ${token}` },
              })
                .its("body")
                .then((tableBody: ApiEnvelope<{ id: number }[]>) => {
                  const available = tableBody.data ?? [];
                  const resolveTable = () => {
                    if (available.length > 0) {
                      return cy.wrap(available[0].id);
                    }
                    return cy
                      .request(`${apiUrl()}/tables/cafe/${cafeId}/available`)
                      .its("body")
                      .then((fallbackBody: ApiEnvelope<{ id: number }[]>) => {
                        const fallback = fallbackBody.data ?? [];
                        return cy.wrap(fallback[0].id);
                      });
                  };

                  resolveTable().then((tableId) => {
                    cy.apiPost(token, "/bookings", {
                      cafeId,
                      tableId,
                      bookingDate: nextDayDate(),
                      bookingTime: "19:00:00",
                      numberOfGuests: 2,
                      specialRequests: "UI customer journey",
                    }).then((bookingRes) => {
                      const bookingId = bookingRes.body.data.id;

                      cy.apiPost(token, "/orders", {
                        bookingId,
                        items: [{ menuItemId, quantity: 1 }],
                        specialInstructions: "UI customer journey",
                      }).then((orderRes) => {
                        const orderId = orderRes.body.data.id;
                        const orderNumber = orderRes.body.data.orderNumber;
                        const amount = Number(orderRes.body.data.totalAmount || 199);
                        cy.wrap(orderId).as("orderId");
                        cy.wrap(orderNumber).as("orderNumber");

                        cy.apiPost(token, "/payments", {
                          orderId,
                          amount,
                          paymentMethod: "UPI",
                        }).then(() => {
                          loginUi("customer1@demo.com", "Customer@123");
                          cy.url().should("include", "/customer/dashboard");

                          cy.visit("/customer/my-orders");
                          cy.get("@orderNumber").then((num) => {
                            cy.contains(String(num), { timeout: 15000 }).should("exist");
                          });

                          cy.get("@orderId").then((id) => {
                            cy.visit(`/customer/order-tracking/${id}`);
                            cy.get("@orderNumber").then((num) => {
                              cy.contains(`Order #${num}`, { timeout: 15000 }).should("exist");
                            });
                          });
                        });
                      });
                    });
                  });
                });
            });
        });
    });
  });
});
