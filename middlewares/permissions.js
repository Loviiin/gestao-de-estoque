// middlewares/permissions.js

exports.isOwner = (req, res, next) => {
    if (req.user && req.user.role === 'owner') {
        return next();
    }
    res.status(403).send('Acesso negado');
};

exports.isManager = (req, res, next) => {
    if (req.user && (req.user.role === 'manager' || req.user.role === 'owner')) {
        return next();
    }
    res.status(403).send('Acesso negado');
};