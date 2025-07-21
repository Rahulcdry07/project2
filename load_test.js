import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp up to 20 virtual users over 30 seconds
    { duration: '1m', target: 20 },  // Stay at 20 virtual users for 1 minute
    { duration: '20s', target: 0 },  // Ramp down to 0 virtual users over 20 seconds
  ],
  thresholds: {
    'http_req_duration{expected_response:true}': ['p(95)<500'], // 95% of requests should be below 500ms
    'http_req_failed': ['rate<0.01'], // Less than 1% of requests should fail
  },
};

export function setup() {
  // Clear database once before all test iterations
  let clearDbRes = http.post('http://localhost:3000/api/test/clear-database');
  check(clearDbRes, { 'database cleared': (r) => r.status === 200 });
  sleep(1);

  // Register and verify user once for the test
  let registerRes = http.post('http://localhost:3000/api/register', JSON.stringify({
    username: 'defaultuser',
    email: 'default@example.com',
    password: 'Password123!',
  }), {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'register' },
  });

  if (registerRes.status === 201) {
    console.log('User registered successfully.');
    let verifyRes = http.post('http://localhost:3000/api/test/verify-user', JSON.stringify({
      email: 'default@example.com',
    }), {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'verify_user' },
    });
    check(verifyRes, { 'user verification successful': (r) => r.status === 200 });
  } else if (registerRes.status === 400 && registerRes.json('error') === 'Username already exists.') {
    console.log('User already exists, proceeding with login.');
  } else {
    console.error(`Registration failed with status ${registerRes.status}: ${registerRes.body}`);
  }

  check(registerRes, { 'registration successful or user exists': (r) => r.status === 201 || (r.status === 400 && r.json('error') === 'Username already exists.') });

  sleep(1);
}

export default function () {
  // Visit the main page
  let res = http.get('http://localhost:3000/dashboard-app/build/index.html');
  check(res, { 'status is 200 on main page': (r) => r.status === 200 });
  sleep(1); // Simulate user reading content

  // Navigate to login and attempt login
  res = http.post('http://localhost:3000/api/login', JSON.stringify({
    email: 'default@example.com', // Use a valid test user
    password: 'Password123!',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  check(res, { 'status is 200 on login': (r) => r.status === 200 });
  check(res, { 'login successful': (r) => r.json('message') === 'Login successful!' });
  sleep(1); // Simulate user interacting after login
}