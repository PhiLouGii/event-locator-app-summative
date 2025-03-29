exports.isAdmin = (req, res, next) => {
    if (!req.user?.is_admin) {
      return res.status(403).json({ 
        error: req.t('forbidden_action') 
      });
    }
    next();
  };