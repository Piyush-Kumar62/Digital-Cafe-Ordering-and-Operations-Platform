describe('Cafe owner API flow', () => {
  it('logs in and loads owner dashboard + cafes', () => {
    cy.apiLogin('owner@cafe.com', 'Owner@123').then((token) => {
      cy.apiGet(token, '/owner/dashboard').then((dashboard) => {
        expect(dashboard.status).to.eq(200);
        expect(dashboard.body).to.have.property('data');
      });

      cy.apiGet(token, '/cafes/my-cafes').then((cafes) => {
        expect(cafes.status).to.eq(200);
      });
    });
  });
});
