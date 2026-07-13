const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

jest.setTimeout(30000);

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    // We mock env so db connection uses this URI
    process.env.MONGO_URI = uri;
    process.env.JWT_SECRET = 'test_secret_key_123';
    process.env.CLOUDINARY_CLOUD_NAME = 'test';
    process.env.CLOUDINARY_API_KEY = 'test';
    process.env.CLOUDINARY_API_SECRET = 'test';
    process.env.FRONTEND_URL = 'http://localhost:3000';
    
    await mongoose.connect(uri);
});

afterAll(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany();
    }
    await mongoose.disconnect();
    await mongoServer.stop();
});
