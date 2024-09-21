import { userModel } from "../models/userModel.js";
import { createResponse } from "../utils/response.js";

// * check if email is a duplicate
const isEmailAlreadyInUsed = async (credentials, userId) => {
  try {
    return await userModel.findOne({
      "credentials.email": credentials.email,
      _id: {
        $ne: userId, // * checks that the ID does not match if provided
      },
    });
  } catch (err) {
    console.error("Error checking if email exists", err);
    throw err;
  }
};

// * check if name is a duplicate
const isNameAlreadyExists = async (personalInfo, userId) => {
  try {
    return await userModel.findOne({
      "personalInfo.firstName": personalInfo.firstName,
      "personalInfo.middleName": personalInfo.middleName,
      "personalInfo.lastName": personalInfo.lastName,
      _id: {
        $ne: userId, // * checks that the ID does not match if provided
      },
    });
  } catch (err) {
    console.error("Error checking if email exists", err);
    throw err;
  }
};

// * check if number is a duplicate
const isNumberAlreadyInUsed = async (contactInfo, userId) => {
  try {
    return await userModel.findOne({
      // * check if any number is in the array
      "contactInfo.phoneNumbers": { $in: contactInfo.phoneNumbers },
      _id: {
        $ne: userId, // * checks that the ID does not match if provided
      },
    });
  } catch (err) {
    console.error("Error checking if email exists", err);
    throw err;
  }
};

// * retrieve all
const getAllUsers = async (req, res) => {
  const response = createResponse();
  try {
    let users = await userModel.find({});
    response.message = "All users retrieved successfully!";
    response.success = true;
    response.users = users;
    return res.json(response);
  } catch (error) {
    console.error("ERROR : ", error);
    response.message = "Internal server error";
    return res.status(500).json(response);
  }
};

// * retrieve one
const getOneUser = async (req, res) => {
  const response = createResponse();
  try {
    const _id = req.params.id;
    let user = await userModel.findOne({ _id: _id });
    response.message = "User retrieved successfully!";
    response.success = true;
    response.user = user;
    return res.json(response);
  } catch (error) {
    console.error("ERROR : ", error);
    response.message = "Internal server error";
    return res.status(500).json(response);
  }
};

// * register
const registerUser = async (req, res) => {
  const response = createResponse();

  try {
    // * destructure for easier access
    const { personalInfo, contactInfo, economicInfo, credentials } = req.body;

    // * validate the req body first before anything
    if (
      !personalInfo.firstName ||
      !personalInfo.middleName ||
      !personalInfo.lastName ||
      !personalInfo.dateOfBirth ||
      !personalInfo.gender ||
      !personalInfo.civilStatus ||
      !personalInfo.nationality ||
      !credentials.email ||
      !credentials.password ||
      !contactInfo.address ||
      !contactInfo.phoneNumbers ||
      !economicInfo.employmentStatus ||
      !economicInfo.occupation
    ) {
      response.message = "Missing required fields!";
      return res.status(400).json(response);
    }

    // * checking for duplicate
    let isNameExists = await isNameAlreadyExists(personalInfo);

    if (isNameExists) {
      response.message = "This name is already registered";
      return res.json(response);
    }

    let isNumberExists = await isNumberAlreadyInUsed(contactInfo);

    if (isNumberExists) {
      response.message = "This number is already registered";
      return res.json(response);
    }

    let isEmailExists = await isEmailAlreadyInUsed(credentials);

    if (isEmailExists) {
      response.message = "Email is already in used";
      return res.json(response);
    }

    // * getting next id from the collection
    // const next = await getNextId();

    // * adding a new user in the User collection
    await userModel.create({
      personalInfo,
      contactInfo,
      economicInfo,
      credentials,
      // _id: ++next._id,
    });

    response.message = "Successfuly registered!";
    response.success = true;
    return res.json(response);
  } catch (error) {
    console.error("ERROR : ", error);
    response.message = "Internal server error";
    return res.status(500).json(response);
  }
};

// * update
const updateUser = async (req, res) => {
  const response = createResponse();
  try {
    // * destructure for easier access
    const { personalInfo, contactInfo, economicInfo, credentials } = req.body;
    const _id = req.params.id;

    // * validate the req body first before anything
    if (
      !_id ||
      !personalInfo.firstName ||
      !personalInfo.middleName ||
      !personalInfo.lastName ||
      !personalInfo.dateOfBirth ||
      !personalInfo.gender ||
      !personalInfo.civilStatus ||
      !personalInfo.nationality ||
      !credentials.email ||
      !credentials.password ||
      !contactInfo.address ||
      !contactInfo.phoneNumbers ||
      !economicInfo.employmentStatus ||
      !economicInfo.occupation
    ) {
      response.message = "Missing required fields!";
      return res.status(400).json(response);
    }

    // * checking for duplicate
    let isNameExists = await isNameAlreadyExists(personalInfo, _id);

    if (isNameExists) {
      response.message = "This name is already registered";
      return res.json(response);
    }

    let isNumberExists = await isNumberAlreadyInUsed(contactInfo, _id);

    if (isNumberExists) {
      response.message = "This number is already registered";
      return res.json(response);
    }

    let isEmailExists = await isEmailAlreadyInUsed(credentials, _id);

    if (isEmailExists) {
      response.message = "Email is already in used";
      return res.json(response);
    }

    await userModel.findByIdAndUpdate(_id, {
      personalInfo,
      contactInfo,
      economicInfo,
      credentials,
    });

    response.message = "User successfuly updated!";
    response.success = true;
    return res.json(response);
  } catch (error) {
    console.error("ERROR : ", error);
    response.message = "Internal server error";
    return res.status(500).json(response);
  }
};

// * remove
const removeUser = async (req, res) => {
  const response = createResponse();
  try {
    const _id = req.params.id;
    const deletedUser = await userModel.findByIdAndDelete(_id);
    if (deletedUser) {
      response.message = "User successfuly deleted!";
      response.success = true;
    } else {
      response.message = "User does not exists!";
      response.success = false;
    }
    return res.json(response);
  } catch (error) {
    console.error("ERROR : ", error);
    response.message = "Internal server error";
    return res.status(500).json(response);
  }
};

export { registerUser, updateUser, removeUser, getAllUsers, getOneUser };
