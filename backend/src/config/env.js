const { z } = require('zod');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
    PORT: z.string().default('5000'),
    MONGO_URI: z.string().url(),
    JWT_SECRET: z.string().min(10),
    CLOUDINARY_CLOUD_NAME: z.string(),
    CLOUDINARY_API_KEY: z.string(),
    CLOUDINARY_API_SECRET: z.string(),
    GEMINI_API_KEY: z.string().default(''),
    FRONTEND_URL: z.string().url().default('http://localhost:3000'),
    BREVO_API_KEY: z.string().default(''),
    BREVO_SENDER_EMAIL: z.string().email().default('no-reply@rentflatmatefinder.com'),
    BREVO_SENDER_NAME: z.string().default('Rent & Flatmate Finder')
});

const envParsed = envSchema.safeParse(process.env);

if (!envParsed.success) {
    console.error('❌ Invalid environment variables:', envParsed.error.format());
    process.exit(1);
}

module.exports = envParsed.data;
