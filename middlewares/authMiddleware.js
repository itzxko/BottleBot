import { verifyToken } from "../controllers/userController.js";

// * authenticate using JWT
const authenticateJWT = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        req.user = decoded;
        next();
      } else {
        res.status(403).json({ message: "Invalid token" });
      }
    } else {
      res.status(401).json({ message: "No token provided" });
    }
  } catch (error) {
    res.status(401).json({ message: "Invalid! Please login." });
  }
};

export { authenticateJWT };
