const { Storage } = require('@google-cloud/storage');
const path = require('path');

// Initialize Google Cloud Storage
const storage = new Storage({
    keyFilename: process.env.GCS_KEYFILE,
});

const bucketName = process.env.GCS_BUCKET_NAME;
const bucket = storage.bucket(bucketName);

/**
 * Uploads a file buffer to Google Cloud Storage.
 * @param {Buffer} fileBuffer - The buffer containing the file data.
 * @param {string} destFileName - The destination file name in the GCS bucket.
 * @returns {Promise<string>} - The public URL of the uploaded file.
 */
async function uploadFileToGCS(fileBuffer, destFileName) {
    const file = bucket.file(destFileName);
    await file.save(fileBuffer, {
        resumable: false, // Good for small files
    });
    console.log(`✅ File buffer uploaded to ${bucketName} as ${destFileName}`);
    return `https://storage.googleapis.com/${bucketName}/${destFileName}`;
}

/**
 * Generates a signed URL for downloading a file from GCS.
 * @param {string} fileName - The name of the file in the GCS bucket.
 * @returns {Promise<string>} - The signed URL for the file.
 */
async function getSignedUrl(fileName) {
    const options = {
        version: 'v4',
        action: 'read',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    };
    const [url] = await bucket.file(fileName).getSignedUrl(options);
    return url;
}

/**
 * Deletes a file from Google Cloud Storage.
 * @param {string} fileName - The name of the file in the GCS bucket.
 * @returns {Promise<void>}
 */
async function deleteFileFromGCS(fileName) {
    await bucket.file(fileName).delete();
    console.log(`✅ ${fileName} deleted from ${bucketName}.`);
}

module.exports = {
    uploadFileToGCS,
    getSignedUrl,
    deleteFileFromGCS,
    bucket, // Export the bucket for more advanced operations if needed
};
