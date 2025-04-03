jest.mock('../../src/middleware/authMiddleware', () => ({
    authenticate: (req, res, next) => {
      // Mock authenticated user
      req.user = { id: 1, username: 'testuser' };
      next();
    }
  }));