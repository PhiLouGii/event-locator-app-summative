module.exports = (req, res) => ({
    serverError: (error) => {
      console.error(error);
      return res.status(500).json({
        success: false,
        error: req.t('server_error'),
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    },
    
    handleValidationError: (error) => {
      if (error instanceof ValidationError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
          details: error.details
        });
      }
      return null;
    }
  });