import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { accessGuard } from '@core/guards/access.guard';
import { AuthService } from '@core/auth/auth.service';
import { UserRole } from '@shared/models/auth.model';

describe('accessGuard', () => {
  let router: jasmine.SpyObj<Router>;
  let authServiceMock: any;

  beforeEach(() => {
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    authServiceMock = {
      isAuthenticated: true,
      currentUserValue: {
        id: 1,
        username: 'customer1',
        email: 'customer1@test.com',
        firstName: 'Customer',
        lastName: 'One',
        roles: [UserRole.CUSTOMER],
        isEmailVerified: true,
        isProfileComplete: true,
        profileCompletionPercentage: 100,
        isActive: true,
      },
      userRoles: [UserRole.CUSTOMER],
      isSystemAdmin: () => false,
      isCustomer: () => true,
      getRoleDashboardRoute: () => '/customer/dashboard',
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: authServiceMock },
      ],
    });
  });

  it('should allow valid authenticated customer', () => {
    const result = TestBed.runInInjectionContext(() =>
      accessGuard(
        { data: { roles: [UserRole.CUSTOMER] } } as any,
        { url: '/customer/dashboard' } as any,
      ),
    );

    expect(result).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should redirect unauthenticated users to login', () => {
    authServiceMock.isAuthenticated = false;

    const result = TestBed.runInInjectionContext(() =>
      accessGuard(
        { data: { roles: [UserRole.CUSTOMER] } } as any,
        { url: '/customer/dashboard' } as any,
      ),
    );

    expect(result).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], {
      queryParams: { returnUrl: '/customer/dashboard' },
    });
  });

  it('should redirect customer to verify email when not verified', () => {
    authServiceMock.currentUserValue.isEmailVerified = false;

    const result = TestBed.runInInjectionContext(() =>
      accessGuard(
        { data: { roles: [UserRole.CUSTOMER] } } as any,
        { url: '/customer/dashboard' } as any,
      ),
    );

    expect(result).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/verify-email']);
  });
});
