const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    const token = req.header('x-auth-token');
    if (!token) {
        return res.status(401).json({ message: 'Không có token, xác thực thất bại' });
    }
    try {
        const secretKey = process.env.JWT_SECRET || 'your_default_secret_key';
        const decoded = jwt.verify(token, secretKey);
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token không hợp lệ' });
    }
};