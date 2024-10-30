import { userModel } from "../models/userModel.js";
import { rewardClaimModel } from "../models/rewardClaimModel.js";
import { bottleDisposalModel } from "../models/bottleDisposalModel.js";
import { createResponse } from "../utils/response.js";

// * check if email is a duplicate
const isEmailAlreadyInUse = async (credentials, userId) => {
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
const isNumberAlreadyInUse = async (contactInfo, userId) => {
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
    // * for searching/filtering, check if the 'level' exists
    // * for pagination, default to 1 and limit to 3
    const { page = 1, limit = 3, level, userName } = req.query;
    console.log(`page ${page} and limit ${limit}`);

    // * converting page and limit to integer to avoid exceptions
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    // * create filter obj dynamically
    let filter = {};
    if (level) {
      filter["credentials.level"] = level;
    }

    if (userName) {
      // * for searching in multiple fields with a match anywhere, case-insensitive
      filter["$or"] = [
        { "personalInfo.firstName": { $regex: userName, $options: "i" } },
        { "personalInfo.middleName": { $regex: userName, $options: "i" } },
        { "personalInfo.lastName": { $regex: userName, $options: "i" } },
      ];
    }

    let users = await userModel
      .find(filter)
      .limit(limitNumber * 1)
      .skip((pageNumber - 1) * limitNumber)
      .exec();

    // * get total count of documents/row based on the filter
    const totalCount = await userModel.countDocuments(filter);

    // * calculate the total pages based on the set limit
    const totalPages = Math.ceil(totalCount / limitNumber);

    response.message = level
      ? `Users with level '${level}' retrieved successfully!`
      : "All users retrieved successfully!";
    response.success = true;
    response.users = users;
    response.totalPages = totalPages;
    response.currentPage = pageNumber;

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
    // let isNameExists = await isNameAlreadyExists(personalInfo);

    // if (isNameExists) {
    //   response.message = "This name is already registered";
    //   return res.json(response);
    // }

    // let isNumberExists = await isNumberAlreadyInUse(contactInfo);

    // if (isNumberExists) {
    //   response.message = "This number is already registered";
    //   return res.json(response);
    // }

    // let isEmailExists = await isEmailAlreadyInUse(credentials);

    // if (isEmailExists) {
    //   response.message = "Email is already in used";
    //   return res.json(response);
    // }

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

    let isNumberExists = await isNumberAlreadyInUse(contactInfo, _id);

    if (isNumberExists) {
      response.message = "This number is already registered";
      return res.json(response);
    }

    let isEmailExists = await isEmailAlreadyInUse(credentials, _id);

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

    // * before deleting user, delete all connected documents
    const deletedRewardClaimHistory = await rewardClaimModel.deleteMany({
      userId: _id,
    });
    if (deletedRewardClaimHistory.deletedCount <= 0) {
      console.log("No reward claim history to be deleted for this user.");
    }
    const deletedDisposalHistory = await bottleDisposalModel.deleteMany({
      userId: _id,
    });
    if (deletedDisposalHistory.deletedCount <= 0) {
      console.log("No disposal history to be deleted for this user.");
    }
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
