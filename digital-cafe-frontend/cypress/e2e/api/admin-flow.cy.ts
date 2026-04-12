describe('Admin API flow', () => {
  it('logs in and reads admin dashboard + users', () => {
    const adminEmail = (Cypress.env('adminEmail') as string) || 'cafehub.admin@gmail.com';
    const adminPassword = (Cypress.env('adminPassword') as string) || 'Admin@123';
    cy.apiLogin(adminEmail, adminPassword).then((token) => {
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
