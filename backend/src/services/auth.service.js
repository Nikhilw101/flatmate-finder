const User = require('../models/User');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const generateToken = (id) => {
    return jwt.sign({ id }, env.JWT_SECRET, {
        expiresIn: '7d',
    });
};

const registerUser = async (userData) => {
    const { name, email, password, role } = userData;

    const userExists = await User.findOne({ email });
    if (userExists) {
        throw new ApiError(400, 'User with this email already exists');
    }

    const user = await User.create({
        name,
        email,
        password,
        role
    });

    const token = generateToken(user._id);

    const userResponse = user.toObject();
    delete userResponse.password;

    return { user: userResponse, token };
};

const loginUser = async (credentials) => {
    const { email, password } = credentials;

    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(401, 'Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw new ApiError(401, 'Invalid email or password');
    }

    const token = generateToken(user._id);

    const userResponse = user.toObject();
    delete userResponse.password;

    return { user: userResponse, token };
};

const getMe = async (userId) => {
    const user = await User.findById(userId).select('-password');
    if (!user) {
        throw new ApiError(404, 'User not found');
    }
    return user;
};

module.exports = {
    registerUser,
    loginUser,
    getMe
};
