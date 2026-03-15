describe('Customer API flow', () => {
  it('logs in and reads bookings/orders/payments', () => {
    cy.apiLogin('customer1@demo.com', 'Customer@123').then((token) => {
      cy.apiGet(token, '/bookings/my-bookings').then((bookings) => {
        expect(bookings.status).to.eq(200);
        expect(bookings.body).to.have.property('data');
      });

      cy.apiGet(token, '/orders/my-orders').then((orders) => {
        expect(orders.status).to.eq(200);
        expect(orders.body).to.have.property('data');
      });

      cy.apiGet(token, '/payments/my').then((payments) => {
        expect(payments.status).to.eq(200);
        expect(payments.body).to.have.property('data');
      });
    });
  });
});
