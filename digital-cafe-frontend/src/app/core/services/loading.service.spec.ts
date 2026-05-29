import { TestBed } from '@angular/core/testing';
import { fakeAsync, tick } from '@angular/core/testing';
import { LoadingService } from '@core/services/loading.service';

describe('LoadingService', () => {
  let service: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoadingService);
  });

  it('should toggle loading state with show and hide', fakeAsync(() => {
    const emissions: boolean[] = [];
    const subscription = service.loading$.subscribe((value) => emissions.push(value));

    service.show();
    tick(250);
    service.hide();
    tick(250);

    expect(emissions).toContain(true);
    expect(emissions[emissions.length - 1]).toBeFalse();
    subscription.unsubscribe();
  }));
});
