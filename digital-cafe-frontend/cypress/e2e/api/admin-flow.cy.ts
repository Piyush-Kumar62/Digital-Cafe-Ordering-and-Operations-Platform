describe('Admin API flow', () => {
  it('logs in and reads admin dashboard + users', () => {
    cy.apiLogin('admin@digitalcafe.com', 'Admin@123').then((token) => {
      cy.apiGet(token, '/admin/dashboard/stats').then((stats) => {
        expect(stats.status).to.eq(200);
        expect(stats.body).to.have.property('data');
      });

      cy.apiGet(token, '/admin/users?page=0&size=5').then((users) => {
        expect(users.status).to.eq(200);
        expect(users.body).to.have.property('data');
      });
    });
  });
});
