describe("Address form pincode autofill", () => {
  it("autofills city/state after pincode lookup", () => {
    cy.intercept(
      "GET",
      "https://api.postalpincode.in/pincode/400001",
      [
        {
          Status: "Success",
          PostOffice: [
            { District: "Mumbai", State: "Maharashtra" },
            { District: "Mumbai", State: "Maharashtra" },
          ],
        },
      ],
    ).as("pincodeLookup");

    cy.visit("/auth/register");

    // Step 1
    cy.get("#username").type("demo_user_123");
    cy.get("#govtIdType").select("Aadhaar");
    cy.get("#govtIdNumber").type("123412341234");
    cy.get("#govtIdProof").selectFile("cypress/fixtures/id-proof.png", {
      force: true,
    });
    cy.contains("button", "Next").click();

    // Step 2
    cy.get("#firstName").type("Riya");
    cy.get("#lastName").type("Sharma");
    cy.get("#email").type("riya.sharma@example.com");
    cy.get("#phone").type("9876543210");
    cy.get("#dateOfBirth").type("1998-04-12");
    cy.get("#gender").select("FEMALE");
    cy.contains("button", "Next").click();

    // Step 3 - Address
    cy.get("#pincode").type("400001");
    cy.wait("@pincodeLookup");

    cy.get("#city").should("have.value", "Mumbai");
    cy.get("#state").should("have.value", "Maharashtra");
    cy.get("#city").should("have.attr", "readonly");
    cy.get("#state").should("have.attr", "readonly");
  });
});
