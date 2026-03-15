describe('Chef API flow', () => {
  it('logs in, checks queue, and advances one order when possible', () => {
    cy.apiLogin('chef1.brew@demo.com', 'Chef@123').then((token) => {
      cy.apiGet(token, '/chef/orders').then((queueResponse) => {
        expect(queueResponse.status).to.eq(200);
        const orders = (queueResponse.body?.data ?? []) as Array<{ id: number; status: string }>;

        const placed = orders.find((o) => o.status === 'PLACED');
        if (placed) {
          cy.apiPut(token, `/chef/order/${placed.id}/preparing`).then((res) => {
            expect([200, 403, 409]).to.include(res.status);
          });
        }

        const preparing = orders.find((o) => o.status === 'PREPARING');
        if (preparing) {
          cy.apiPut(token, `/chef/order/${preparing.id}/ready`).then((res) => {
            expect([200, 403, 409]).to.include(res.status);
          });
        }
      });
    });
  });
});
