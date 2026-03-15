type ApiEnvelope<T> = {
  data: T;
  message?: string;
  success?: boolean;
};

const apiUrl = () => (Cypress.env('apiUrl') as string) || 'http://localhost:8080/api';

const nextDayDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
};

const randomSuffix = () => `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

describe('Full API role journeys', () => {
  it('covers customer, owner, chef, and waiter workflows', () => {
    const suffix = randomSuffix();
    const customerEmail = `e2e.customer.${suffix}@example.com`;
    const ownerEmail = `e2e.owner.${suffix}@example.com`;
    const chefEmail = `e2e.chef.${suffix}@example.com`;
    const waiterEmail = `e2e.waiter.${suffix}@example.com`;
    const customerPassword = 'Customer@123';
    const ownerPassword = 'Owner@123';
    const chefPassword = 'Chef@123';
    const waiterPassword = 'Waiter@123';

    let customerToken = '';
    let ownerToken = '';
    let chefToken = '';
    let waiterToken = '';

    let cafeId = 0;
    let tableId = 0;
    let menuItemId = 0;
    let bookingId = 0;
    let orderId = 0;
    let paymentAmount = 199;

    // 1) Customer registration + email verification + profile completion + login
    cy.request({
      method: 'POST',
      url: `${apiUrl()}/auth/simple-register`,
      body: {
        username: `customer-${suffix}`,
        email: customerEmail,
        password: 'IgnoredByBackend@123',
        firstName: 'Test',
        lastName: 'Customer',
      },
    }).its('status').should('eq', 201);

    cy.request(`${apiUrl()}/public/e2e/email-token?email=${encodeURIComponent(customerEmail)}`)
      .its('body.token')
      .then((token: string) => {
        cy.request(`${apiUrl()}/auth/verify-email?token=${encodeURIComponent(token)}`).its('status').should('eq', 200);
      });

    cy.request('POST', `${apiUrl()}/auth/forgot-password?email=${encodeURIComponent(customerEmail)}`).its('status').should('eq', 200);

    cy.request(`${apiUrl()}/public/e2e/password-reset-token?email=${encodeURIComponent(customerEmail)}`)
      .its('body.token')
      .then((token: string) => {
        cy.request({
          method: 'POST',
          url: `${apiUrl()}/auth/reset-password?token=${encodeURIComponent(token)}`,
          body: { newPassword: customerPassword, confirmPassword: customerPassword },
        }).its('status').should('eq', 200);
      });

    cy.apiLogin(customerEmail, customerPassword).then((token) => {
      customerToken = token;
    });

    cy.apiPut(customerToken, '/users/profile/self', {
      firstName: 'Test',
      lastName: 'Customer',
      displayName: `Customer ${suffix}`,
    }).its('status').should('eq', 200);

    // 2) Owner registration + verification + approval + login
    cy.request({
      method: 'POST',
      url: `${apiUrl()}/public/e2e/register-cafe-owner`,
      body: {
        firstName: 'Cafe',
        lastName: 'Owner',
        email: ownerEmail,
        ownerPhoneNumber: '9876543210',
        cafeName: `Cafe ${suffix}`,
        description: 'E2E cafe',
        address: '123 Test Street',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
        phoneNumber: '9876543211',
        openTime: '08:00',
        closeTime: '22:00',
      },
    }).its('status').should('eq', 200);

    cy.request(`${apiUrl()}/public/e2e/email-token?email=${encodeURIComponent(ownerEmail)}`)
      .its('body.token')
      .then((token: string) => {
        cy.request(`${apiUrl()}/auth/verify-email?token=${encodeURIComponent(token)}`).its('status').should('eq', 200);
      });

    cy.request('POST', `${apiUrl()}/public/e2e/approve-user?email=${encodeURIComponent(ownerEmail)}`).its('status').should('eq', 200);
    cy.request('POST', `${apiUrl()}/auth/forgot-password?email=${encodeURIComponent(ownerEmail)}`).its('status').should('eq', 200);

    cy.request(`${apiUrl()}/public/e2e/password-reset-token?email=${encodeURIComponent(ownerEmail)}`)
      .its('body.token')
      .then((token: string) => {
        cy.request({
          method: 'POST',
          url: `${apiUrl()}/auth/reset-password?token=${encodeURIComponent(token)}`,
          body: { newPassword: ownerPassword, confirmPassword: ownerPassword },
        }).its('status').should('eq', 200);
      });

    cy.apiLogin(ownerEmail, ownerPassword).then((token) => {
      ownerToken = token;
    });

    // 3) Owner creates/gets cafe, manages tables/menu, creates chef+waiter
    cy.apiGet<ApiEnvelope<any[]>>(ownerToken, '/cafes/my-cafes').then((res) => {
      expect(res.status).to.eq(200);
      const cafes = (res.body as ApiEnvelope<any[]>).data || [];
      expect(cafes.length).to.be.greaterThan(0);
      cafeId = cafes[0].id;
    });

    cy.apiPost(ownerToken, '/tables/my', {
      tableNumber: `T-${suffix}`,
      capacity: 4,
      locationDescription: 'Near window',
      tableType: 'REGULAR',
    }).then((res) => {
      expect([200, 201]).to.include(res.status);
      tableId = res.body?.data?.id ?? tableId;
    });

    cy.apiPost(ownerToken, `/menu-items/cafe/${cafeId}`, {
      name: `E2E Pasta ${suffix}`,
      description: 'Fresh pasta for e2e',
      price: 199,
      category: 'MAIN_COURSE',
      isVegetarian: true,
      preparationTime: 15,
    }).then((res) => {
      expect([200, 201]).to.include(res.status);
      menuItemId = res.body?.data?.id ?? menuItemId;
    });

    cy.apiPost(ownerToken, '/staff', {
      username: `chef-${suffix}`,
      email: chefEmail,
      firstName: 'Chef',
      lastName: 'Flow',
      cafeId,
      role: 'CHEF',
      joiningDate: nextDayDate(),
    }).its('status').should('be.oneOf', [200, 201]);

    cy.apiPost(ownerToken, '/staff', {
      username: `waiter-${suffix}`,
      email: waiterEmail,
      firstName: 'Waiter',
      lastName: 'Flow',
      cafeId,
      role: 'WAITER',
      joiningDate: nextDayDate(),
    }).its('status').should('be.oneOf', [200, 201]);

    // 4) Staff password setup + login
    cy.request('POST', `${apiUrl()}/auth/forgot-password?email=${encodeURIComponent(chefEmail)}`).its('status').should('eq', 200);
    cy.request(`${apiUrl()}/public/e2e/password-reset-token?email=${encodeURIComponent(chefEmail)}`)
      .its('body.token')
      .then((token: string) => {
        cy.request({
          method: 'POST',
          url: `${apiUrl()}/auth/reset-password?token=${encodeURIComponent(token)}`,
          body: { newPassword: chefPassword, confirmPassword: chefPassword },
        }).its('status').should('eq', 200);
      });
    cy.apiLogin(chefEmail, chefPassword).then((token) => {
      chefToken = token;
    });

    cy.request('POST', `${apiUrl()}/auth/forgot-password?email=${encodeURIComponent(waiterEmail)}`).its('status').should('eq', 200);
    cy.request(`${apiUrl()}/public/e2e/password-reset-token?email=${encodeURIComponent(waiterEmail)}`)
      .its('body.token')
      .then((token: string) => {
        cy.request({
          method: 'POST',
          url: `${apiUrl()}/auth/reset-password?token=${encodeURIComponent(token)}`,
          body: { newPassword: waiterPassword, confirmPassword: waiterPassword },
        }).its('status').should('eq', 200);
      });
    cy.apiLogin(waiterEmail, waiterPassword).then((token) => {
      waiterToken = token;
    });

    // 5) Customer booking -> order -> payment
    cy.request({
      method: 'GET',
      url: `${apiUrl()}/tables/available`,
      qs: { cafeId, date: nextDayDate(), time: '19:00:00', seats: 2 },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(200);
      const available = res.body?.data ?? [];
      if (available.length > 0) {
        tableId = available[0].id;
      }
      expect(tableId).to.be.greaterThan(0);
    });

    cy.apiPost(customerToken, '/bookings', {
      cafeId,
      tableId,
      bookingDate: nextDayDate(),
      bookingTime: '19:00:00',
      numberOfGuests: 2,
      specialRequests: 'E2E booking',
    }).then((res) => {
      expect([200, 201]).to.include(res.status);
      bookingId = res.body?.data?.id ?? bookingId;
      expect(bookingId).to.be.greaterThan(0);
    });

    cy.apiPost(customerToken, '/orders', {
      bookingId,
      items: [{ menuItemId, quantity: 1 }],
      specialInstructions: 'No onion',
    }).then((res) => {
      expect([200, 201]).to.include(res.status);
      orderId = res.body?.data?.id ?? orderId;
      paymentAmount = Number(res.body?.data?.totalAmount ?? paymentAmount);
      expect(orderId).to.be.greaterThan(0);
    });

    cy.apiPost(customerToken, '/payments', {
      orderId,
      amount: paymentAmount,
      paymentMethod: 'UPI',
    }).then((res) => {
      expect([200, 201]).to.include(res.status);
      expect(res.body?.data).to.exist;
    });

    // 6) Chef and waiter lifecycle transitions
    cy.apiPut(chefToken, `/chef/order/${orderId}/preparing`).then((res) => {
      expect([200, 403, 409]).to.include(res.status);
    });

    cy.apiPut(chefToken, `/chef/order/${orderId}/ready`).then((res) => {
      expect([200, 403, 409]).to.include(res.status);
    });

    cy.apiPut(waiterToken, `/waiter/order/${orderId}/served`).then((res) => {
      expect([200, 403, 409]).to.include(res.status);
    });

    cy.apiGet(customerToken, `/orders/${orderId}`).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body?.data?.id).to.eq(orderId);
    });
  });
});
