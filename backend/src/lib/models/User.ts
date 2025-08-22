import bcrypt from 'bcrypt';
import { query, getOne, insert, update } from '../db';

export class User {
  static async findByUsername(username) {
    return await getOne(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
  }

  static async findById(id) {
    return await getOne(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
  }

  static async create(userData) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const userId = await insert('users', {
      username: userData.username,
      password_hash: hashedPassword,
      email: userData.email || null
    });
    
    return userId;
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updatePassword(userId, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    return await update(
      'users',
      { password_hash: hashedPassword },
      'id = ?',
      [userId]
    );
  }
}