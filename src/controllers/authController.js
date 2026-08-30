import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import AppError from '../utils/AppError.js';
import { successResponse } from '../utils/apiResponse.js';
import authConfig from '../config/auth.js';

const { jwtSecret, jwtExpiresIn } = authConfig;

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('Email already registered', 409);
    }

    const user = await User.create({ name, email, password });
    const token = jwt.sign({ id: user.id, email: user.email }, jwtSecret, { expiresIn: jwtExpiresIn });

    return successResponse(res, { user: user.toSafeJSON(), token }, 'User registered successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.validatePassword(password))) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = jwt.sign({ id: user.id, email: user.email }, jwtSecret, { expiresIn: jwtExpiresIn });

    return successResponse(res, { user: user.toSafeJSON(), token }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    return successResponse(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return successResponse(res, { user: user.toSafeJSON() });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (avatar !== undefined) updateData.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return successResponse(res, { user: user.toSafeJSON() }, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isValid = await user.validatePassword(currentPassword);
    if (!isValid) {
      throw new AppError('Current password is incorrect', 401);
    }

    user.password = newPassword;
    await user.save();

    return successResponse(res, null, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};
