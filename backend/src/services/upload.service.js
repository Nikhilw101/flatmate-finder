const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

/**
 * Uploads a single file buffer to Cloudinary.
 * @param {Buffer} fileBuffer - The file buffer from multer memory storage.
 * @param {string} folder - Cloudinary folder to upload into.
 * @returns {Promise<{url: string, publicId: string}>}
 */
const uploadToCloudinary = (fileBuffer, folder = 'rent_flatmate') => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder, resource_type: 'image' },
            (error, result) => {
                if (error) return reject(error);
                resolve({ url: result.secure_url, publicId: result.public_id });
            }
        );
        streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
};

/**
 * Deletes an image from Cloudinary by its public ID.
 * @param {string} publicId - The Cloudinary public ID of the image.
 * @returns {Promise<void>}
 */
const deleteFromCloudinary = async (publicId) => {
    await cloudinary.uploader.destroy(publicId);
};

/**
 * Uploads multiple file buffers to Cloudinary concurrently.
 * @param {Express.Multer.File[]} files - Array of multer file objects.
 * @param {string} folder - Cloudinary folder name.
 * @returns {Promise<Array<{url: string, publicId: string}>>}
 */
const uploadMultipleToCloudinary = (files, folder = 'rent_flatmate') => {
    return Promise.all(files.map((file) => uploadToCloudinary(file.buffer, folder)));
};

module.exports = {
    uploadToCloudinary,
    deleteFromCloudinary,
    uploadMultipleToCloudinary
};
