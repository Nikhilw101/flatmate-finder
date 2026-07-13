const mongoose = require('mongoose');
const multer = require('multer');

const errorHandler = (err, req, res, next) => {
    // Handle Multer-specific errors (file size, file count, wrong type)
    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            success: false,
            message: err.message,
            errors: []
        });
    }

    // Handle invalid MongoDB ObjectId cast errors → return 400 not 500
    if (err instanceof mongoose.Error.CastError && err.kind === 'ObjectId') {
        return res.status(400).json({
            success: false,
            message: 'Invalid ID format',
            errors: []
        });
    }

    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
        errors: err.errors || [],
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
};

module.exports = { errorHandler };
