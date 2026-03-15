import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 100,
  duration: '2m',
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.02'],
  },
};

const baseUrl = __ENV.BASE_URL || 'http://localhost:8080';

export default function () {
  const health = http.get(`${baseUrl}/api/public/health`);
  check(health, {
    'health status is 200': (r) => r.status === 200,
  });

  const ping = http.get(`${baseUrl}/api/public/ping`);
  check(ping, {
    'ping status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
