const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const generateToken = require('../utils/generateToken');
const { ROLES } = require('../constants/roles');
const { sendPasswordResetEmail } = require('../utils/email.util');

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
    attributes: { exclude: ['password_hash', 'reset_token_hash', 'reset_token_expires_at'] },
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

const forgotPassword = async (email) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    // Security: Don't reveal if email exists or not
    return { message: 'If an account with that email exists, a reset link has been sent.' };
  }

  // Generate plain reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hash token to store in database
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
  
  // Set expiry to 15 minutes from now
  const resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

  user.reset_token_hash = resetTokenHash;
  user.reset_token_expires_at = resetTokenExpiresAt;
  await user.save();

  // Send actual email via Brevo
  await sendPasswordResetEmail(user.email, user.name, resetToken);

  return { message: 'Password reset link sent to your email.' };
};

const resetPassword = async (token, newPassword) => {
  // Hash the incoming token to match with the database
  const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    where: {
      reset_token_hash: resetTokenHash,
    },
  });

  if (!user) {
    throw new ApiError(400, 'Invalid or expired reset token');
  }

  // Check if token has expired
  if (user.reset_token_expires_at < new Date()) {
    throw new ApiError(400, 'Invalid or expired reset token');
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  user.password_hash = await bcrypt.hash(newPassword, salt);

  // Clear reset token fields
  user.reset_token_hash = null;
  user.reset_token_expires_at = null;
  
  await user.save();

  return { message: 'Password has been reset successfully' };
};

module.exports = {
  createSuperAdminUser,
  createOwnerBySuperAdmin,
  loginUser,
  getUserProfile,
  updateUserProfile,
  forgotPassword,
  resetPassword,
};
