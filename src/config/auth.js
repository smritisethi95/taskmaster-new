export default {
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-key-do-not-use-in-prod',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d'
};
