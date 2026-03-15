import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ApiService } from '@core/services/api.service';

describe('ApiService', () => {
  let service: ApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService],
    });
    service = TestBed.inject(ApiService);
  });

  it('should resolve absolute URLs unchanged', () => {
    const source = 'https://images.example.com/photo.jpg';
    expect(service.resolveImageUrl(source)).toBe(source);
  });

  it('should resolve backend relative image URLs', () => {
    const resolved = service.resolveImageUrl('/uploads/cafes/logo.png');
    expect(resolved).toContain('/uploads/cafes/logo.png');
    expect(resolved.startsWith('http')).toBeTrue();
  });

  it('should discard local filesystem paths', () => {
    expect(service.resolveImageUrl('C:\\temp\\logo.png')).toBe('');
  });
});
