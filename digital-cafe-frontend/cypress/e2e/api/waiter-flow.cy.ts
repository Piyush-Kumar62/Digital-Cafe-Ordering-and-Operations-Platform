describe('Waiter API flow', () => {
  it('logs in, checks ready orders, and serves one when possible', () => {
    cy.apiLogin('waiter1.brew@demo.com', 'Waiter@123').then((token) => {
      cy.apiGet(token, '/waiter/ready-orders').then((readyResponse) => {
        expect(readyResponse.status).to.eq(200);
        const readyOrders = (readyResponse.body?.data ?? []) as Array<{ id: number }>;

        if (readyOrders.length > 0) {
          cy.apiPut(token, `/waiter/order/${readyOrders[0].id}/served`).then((serveResponse) => {
            expect([200, 403, 409]).to.include(serveResponse.status);
          });
        }
      });
    });
  });
});
