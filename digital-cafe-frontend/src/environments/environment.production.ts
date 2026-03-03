export const environment = {
  production: true,
  apiUrl: "http://localhost:8080/api",
  wsUrl: "http://localhost:8080/ws",
  appName: "Digital Cafe Platform",
  tokenKey: "cafe_auth_token",
  refreshTokenKey: "cafe_refresh_token",
  userKey: "cafe_user_data",
  razorpayKeyId: "", // Set production Razorpay live key via env at deploy time
};
