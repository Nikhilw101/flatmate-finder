const authService = require('../services/auth.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

const register = catchAsync(async (req, res) => {
    const data = await authService.registerUser(req.body);
    res.status(201).json(
        new ApiResponse(201, data, 'User registered successfully')
    );
});

const login = catchAsync(async (req, res) => {
    const data = await authService.loginUser(req.body);
    res.status(200).json(
        new ApiResponse(200, data, 'Login successful')
    );
});

const getMe = catchAsync(async (req, res) => {
    const data = await authService.getMe(req.user._id);
    res.status(200).json(
        new ApiResponse(200, data, 'User data retrieved successfully')
    );
});

module.exports = {
    register,
    login,
    getMe
};
