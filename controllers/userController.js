import jwt from "jsonwebtoken";
import { userModel } from "../models/userModel.js";

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

// * check if email is a duplicate
const isEmailAlreadyInUsed = async (newUser) => {
  try {
    return await userModel.findOne({
      email: newUser.email,
      _id: {
        $ne: newUser._id,
      },
    });
  } catch (err) {
    console.error("Error checking if email exists", err);
    throw err;
  }
};

// * check if the user is present in the database
const validateUser = async (user) => {
  try {
    return await userModel.findOne(user);
  } catch (err) {
    console.error("ERROR AUTHENTICATING USER");
  }
};

// * register
const register = async (req, res) => {
  try {
    const newUser = req.body;

    // * validate the req body first before anything
    if (!newUser.email || !newUser.password) {
      res.status(400).json({ message: "Missing required fields!" });
      return;
    }

    // * checking for duplicate
    // let isNameExists = await isUserAlreadyExists(newUser);

    // if (isNameExists) {
    //   res.json({ message: "Name is already registered" });
    //   return;
    // }

    let isEmailExists = await isEmailAlreadyInUsed(newUser);

    if (isEmailExists) {
      res.json({ message: "Email is already in used" });
      return;
    }

    // * getting next id from the collection
    // const next = await getNextId();

    // * adding a new user in the User collection
    await userModel.create({
      // _id: ++next._id,
      // firstName: req.body.firstName,
      // lastName: req.body.lastName,
      email: req.body.email,
      password: req.body.password,
      // level: "user",
    });

    res.json({ message: "Successfuly registered!" });
  } catch (err) {
    console.error("ERROR : ", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// * login
const login = async (req, res) => {
  try {
    const user = req.body;

    // * validate the req body first before anything
    if (!user.email || !user.password) {
      res.status(400).json({ message: "Missing required fields!" });
      return;
    }

    const userFromDatabase = await validateUser(user);
    if (!userFromDatabase) {
      res.json({ message: "Incorrect email or password" });
      return;
    }

    const token = generateToken(user.email);

    res.json({
      message: "Login success!",
      user: userFromDatabase, // ? test
      token: token, // ? test
    });
  } catch (err) {
    console.error(err);
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

// ! TO BE DELETED, NOT NEEDED
// Function to set username using token
// const setUsernameFromToken = (token) => {
//   const decoded = verifyToken(token);
//   console.log("Decoded:", decoded); // Debugging
//   if (decoded) {
//     console.log("Decoded Username:", decoded.username); // Debugging
//     return decoded.username;
//   } else {
//     return null; // Invalid token
//   }
// };

export {
  verifyToken,
  setJWTUsername,
  getJWTUsername,
  register,
  login,
  innerRoute,
};
