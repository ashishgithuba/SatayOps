const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { ROLES, STATUS } = require('../constants/roles');

const seedSuperAdmin = async () => {
  try {
    const adminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@stayops.com';
    const adminPhone = process.env.SUPER_ADMIN_PHONE || '0000000000';
    const adminPassword = process.env.SUPER_ADMIN_PASSWORD || 'Admin@123456';

    const adminExists = await User.findOne({ where: { role: ROLES.SUPER_ADMIN } });

    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(adminPassword, salt);

      await User.create({
        name: 'Super Admin',
        email: adminEmail,
        phone: adminPhone,
        password_hash,
        role: ROLES.SUPER_ADMIN,
        status: STATUS.ACTIVE,
      });

      console.log(`[SEED] Initial Super Admin created successfully (${adminEmail})`);
    }
  } catch (error) {
    console.error('[SEED] Error seeding Super Admin:', error.message);
  }
};

module.exports = seedSuperAdmin;
