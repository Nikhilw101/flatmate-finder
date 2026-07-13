const fs = require('fs');
const path = require('path');

const folders = [
  'backend/src/config',
  'backend/src/routes',
  'backend/src/controllers',
  'backend/src/services',
  'backend/src/models',
  'backend/src/middlewares',
  'backend/src/validators',
  'backend/src/sockets',
  'backend/src/ai',
  'backend/src/utils',
  'backend/src/docs',
  'backend/scripts',
  'backend/logs'
];

const files = [
  'backend/src/app.js',
  'backend/src/server.js',
  'backend/src/config/db.js',
  'backend/src/config/env.js',
  'backend/src/config/logger.js',
  'backend/src/config/cloudinary.js',
  'backend/src/config/socket.js',
  'backend/src/config/ai.js',
  'backend/src/config/mail.js',
  'backend/src/config/cors.js',
  'backend/src/config/helmet.js',
  'backend/src/routes/auth.routes.js',
  'backend/src/routes/users.routes.js',
  'backend/src/routes/listings.routes.js',
  'backend/src/routes/interests.routes.js',
  'backend/src/routes/chats.routes.js',
  'backend/src/routes/notifications.routes.js',
  'backend/src/routes/admin.routes.js',
  'backend/src/routes/index.js',
  'backend/src/controllers/auth.controller.js',
  'backend/src/controllers/user.controller.js',
  'backend/src/controllers/listing.controller.js',
  'backend/src/controllers/interest.controller.js',
  'backend/src/controllers/chat.controller.js',
  'backend/src/controllers/notification.controller.js',
  'backend/src/controllers/admin.controller.js',
  'backend/src/services/auth.service.js',
  'backend/src/services/user.service.js',
  'backend/src/services/listing.service.js',
  'backend/src/services/compatibility.service.js',
  'backend/src/services/ai.service.js',
  'backend/src/services/upload.service.js',
  'backend/src/services/email.service.js',
  'backend/src/services/interest.service.js',
  'backend/src/services/notification.service.js',
  'backend/src/services/chat.service.js',
  'backend/src/services/admin.service.js',
  'backend/src/models/User.js',
  'backend/src/models/Listing.js',
  'backend/src/models/Compatibility.js',
  'backend/src/models/Interest.js',
  'backend/src/models/Chat.js',
  'backend/src/models/Message.js',
  'backend/src/models/Notification.js',
  'backend/src/models/RefreshToken.js',
  'backend/src/middlewares/auth.middleware.js',
  'backend/src/middlewares/role.middleware.js',
  'backend/src/middlewares/validation.middleware.js',
  'backend/src/middlewares/upload.middleware.js',
  'backend/src/middlewares/rateLimit.middleware.js',
  'backend/src/middlewares/error.middleware.js',
  'backend/src/middlewares/notFound.middleware.js',
  'backend/src/validators/auth.validator.js',
  'backend/src/validators/listing.validator.js',
  'backend/src/validators/interest.validator.js',
  'backend/src/validators/chat.validator.js',
  'backend/src/sockets/index.js',
  'backend/src/sockets/auth.socket.js',
  'backend/src/sockets/chat.socket.js',
  'backend/src/sockets/notification.socket.js',
  'backend/src/ai/compatibility.prompt.js',
  'backend/src/ai/parser.js',
  'backend/src/utils/ApiError.js',
  'backend/src/utils/ApiResponse.js',
  'backend/src/utils/catchAsync.js',
  'backend/src/utils/pagination.js',
  'backend/src/utils/constants.js',
  'backend/src/docs/swagger.js',
  'backend/scripts/seed.js',
  'backend/.env',
  'backend/.env.example',
  'backend/.gitignore',
  'backend/package.json',
  'backend/Dockerfile',
  'backend/README.md',
  'backend/nodemon.json'
];

folders.forEach(folder => {
  fs.mkdirSync(path.join(__dirname, folder), { recursive: true });
});

files.forEach(file => {
  fs.writeFileSync(path.join(__dirname, file), '');
});

// Write basic content to package.json
fs.writeFileSync(path.join(__dirname, 'backend/package.json'), JSON.stringify({
  "name": "rent-flatmate-finder-backend",
  "version": "1.0.0",
  "description": "Backend API for Rent & Flatmate Finder",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.0.0",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "dotenv": "^16.0.3",
    "socket.io": "^4.6.1"
  }
}, null, 2));

console.log('Structure created successfully');
