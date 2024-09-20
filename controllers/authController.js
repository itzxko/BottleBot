import jwt from "jsonwebtoken";
import { userModel } from "../models/userModel.js";
import { createResponse } from "../utils/response.js";

// * generate JWT
const generateToken = (username) => {
  const payload = { username };
  const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "1h",
  }); // * token expires in 1 hour
  return token;
};

// * verify JWT
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    return decoded;
  } catch (err) {
    return null; // * Invalid token
  }
};

// * Check if the user is present in the database and validate password
const validateUser = async (credentials) => {
  try {
    // * find the user by email
    const user = await userModel.findOne({
      "credentials.email": credentials.email,
    });
    // * if found, check the password
    if (user && user.credentials.password === credentials.password) {
      return user; // * if authentication is successful
    } else {
      return null; // * if user is not found or password does not match
    }
  } catch (err) {
    console.error("ERROR AUTHENTICATING USER:", err);
    throw err;
  }
};

// * login
const login = async (req, res) => {
  const response = createResponse();

  try {
    const credentials = req.body;

    // * validate the request body first before anything
    if (!credentials.email || !credentials.password) {
      response.message = "Missing required fields!";
      return res.status(400).json(response);
    }

    // * validate user credentials
    const userFromDatabase = await validateUser(credentials);

    if (!userFromDatabase) {
      response.message = "Incorrect email or password";
      return res.json(response); // * 401 unauthorized for failed login 
    }

    // * if successful, generate a token
    const token = generateToken(userFromDatabase.credentials.email); // * using userFromDatabase's email
    response.message = "Login success!";
    response.success = true;
    response.user = {
      firstName: userFromDatabase.personalInfo.firstName,
      lastName: userFromDatabase.personalInfo.lastName,
      email: userFromDatabase.credentials.email,
    };
    response.token = token;

    return res.json(response);
  } catch (err) {
    console.error("ERROR DURING LOGIN:", err);
    response.message = "Internal server error";
    return res.status(500).json(response);
  }
};

// ! TO BE DELETED
// ? FF FUNCS ARE FOR TESTING THE JWT ONLY
// ? test func for setting jwt username
// ? generate a token
const setJWTUsername = (req, res) => {
  const { username } = req.params;
  const token = generateToken(username);
  res.json({ token });
};

// ? test func for getting jwt username
// ? get username from token
const getJWTUsername = (req, res) => {
  const { username } = req.user;
  if (username) {
    res.json({ username });
  } else {
    res.status(400).json({ message: "Could not retrieve username" });
  }
};

// ? test func to access inner route after login
const innerRoute = (req, res) => {
  res.json({ message: "INNER ROUTE", username: req.user.username });
};

export { login, innerRoute, setJWTUsername, getJWTUsername, verifyToken };
