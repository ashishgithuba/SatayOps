const bcrypt = require('bcryptjs');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const generateToken = require('../utils/generateToken');
const { ROLES } = require('../constants/roles');

// Step 1: Create Super Admin directly (Public endpoint)
const createSuperAdminUser = async (userData) => {
  const { name, email, phone, password } = userData;

  const emailExists = await User.findOne({ where: { email } });
  if (emailExists) {
    throw new ApiError(400, 'Super Admin with this email already exists');
  }

  const phoneExists = await User.findOne({ where: { phone } });
  if (phoneExists) {
    throw new ApiError(400, 'Super Admin with this phone number already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);

  const admin = await User.create({
    name,
    email,
    phone,
    password_hash,
    role: ROLES.SUPER_ADMIN,
  });

  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    phone: admin.phone,
    role: admin.role,
    status: admin.status,
    token: generateToken(admin.id),
  };
};

// Step 3: Super Admin creates PG Owner (Protected endpoint)
const createOwnerBySuperAdmin = async (userData) => {
  const { name, email, phone, password } = userData;

  const emailExists = await User.findOne({ where: { email } });
  if (emailExists) {
    throw new ApiError(400, 'Owner with this email already exists');
  }

  const phoneExists = await User.findOne({ where: { phone } });
  if (phoneExists) {
    throw new ApiError(400, 'Owner with this phone number already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);

  const owner = await User.create({
    name,
    email,
    phone,
    password_hash,
    role: ROLES.OWNER,
  });

  return {
    id: owner.id,
    name: owner.name,
    email: owner.email,
    phone: owner.phone,
    role: owner.role,
    status: owner.status,
    created_at: owner.created_at,
  };
};

const loginUser = async (email, password) => {
  const user = await User.findOne({ where: { email } });

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (user.status === 'BLOCKED' || user.status === 'INACTIVE') {
    throw new ApiError(403, `Account is ${user.status}. Please contact administrator.`);
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  user.last_login_at = new Date();
  await user.save();

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    token: generateToken(user.id),
  };
};

const getUserProfile = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: { exclude: ['password_hash'] },
  });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return user;
};

const updateUserProfile = async (userId, updateData) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const { name, phone, profile_image, password } = updateData;

  if (phone && phone !== user.phone) {
    const phoneExists = await User.findOne({ where: { phone } });
    if (phoneExists) {
      throw new ApiError(400, 'Phone number already in use');
    }
    user.phone = phone;
  }

  if (name) user.name = name;
  if (profile_image !== undefined) user.profile_image = profile_image;

  if (password) {
    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(password, salt);
  }

  await user.save();

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    profile_image: user.profile_image,
    updated_at: user.updated_at,
  };
};

module.exports = {
  createSuperAdminUser,
  createOwnerBySuperAdmin,
  loginUser,
  getUserProfile,
  updateUserProfile,
};
