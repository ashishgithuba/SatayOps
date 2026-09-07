require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/database');
const seedSuperAdmin = require('./utils/seedSuperAdmin');

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  // Auto-seed initial Super Admin account if not present
  await seedSuperAdmin();

  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
});
