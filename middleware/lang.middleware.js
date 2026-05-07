module.exports = (req, res, next) => {
    // Check header; Flutter sends 'am' or 'en'
    const lang = req.headers['accept-language'];
    req.lang = lang === 'am' ? 'am' : 'en'; 
    next();
  };