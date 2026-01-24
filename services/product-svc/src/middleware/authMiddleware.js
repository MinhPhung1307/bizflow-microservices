import jwt from 'jsonwebtoken';

export const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Lấy token từ header "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];

      // Giải mã token (JWT_SECRET cần khớp với identity-svc)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Lưu thông tin user vào request để dùng ở Controller
      req.user = decoded; 
      
      next();
    } catch (error) {
      console.error('Token verification failed:', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};