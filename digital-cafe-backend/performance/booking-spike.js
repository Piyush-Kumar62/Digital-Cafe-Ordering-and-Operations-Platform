import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    booking_spike: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '30s', target: 100 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1500'],
  },
};

const baseUrl = __ENV.BASE_URL || 'http://localhost:8080';

export default function () {
  const response = http.get(`${baseUrl}/api/public/health`);
  check(response, {
    'health check ok': (r) => r.status === 200,
  });
  sleep(0.5);
}
