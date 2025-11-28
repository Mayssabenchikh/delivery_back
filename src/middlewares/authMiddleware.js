const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Token manquant' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false,
        message: 'Token invalide' 
      });
    }
    req.user = user; // contient { id, email, role }
    next();
  });
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: 'Accès refusé : rôle non autorisé' 
      });
    }
    next();
  };
};

// Export as default for backward compatibility
module.exports = authenticateToken;
module.exports.authorizeRoles = authorizeRoles;

// Export with names expected by company routes
module.exports.authMiddleware = authenticateToken;
module.exports.isCompany = authorizeRoles('company');
