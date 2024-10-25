// response.js

const successResponse = (res, data = {}, message = 'Success', code = 200) => {
    return res.status(code).json({
        status: 'success',
        code,
        message,
        data,
        error: null,
    });
};

// For User Errors (e.g., 400 Bad Request, 401 Unauthorized)
const userErrorResponse = (
    res,
    message = 'Invalid request',
    code = 400,
    details = {}
) => {
    return res.status(code).json({
        status: 'fail',
        code,
        message,
        data: null,
        error: details, // Specific validation or input errors
    });
};

// For System Errors (e.g., 500 Internal Server Error)
const systemErrorResponse = (
    res,
    message = 'Something went wrong',
    code = 500,
    error = {}
) => {
    return res.status(code).json({
        status: 'error',
        code,
        message,
        data: null,
        error: {
            message: error.message || 'Internal Server Error',
            // stack: process.env.NODE_ENV === 'production' ? null : error.stack, // Hide stack trace in production
        },
    });
};

module.exports = {
    successResponse,
    userErrorResponse,
    systemErrorResponse,
};
