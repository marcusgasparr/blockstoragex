import bcrypt from 'bcrypt';
import { query, getOne, insert } from '../db';

interface UserData {
  username: string;
  password: string;
  email?: string;
}

export class User {
  static async findByUsername(username: string): Promise<any> {
    return await getOne(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
  }

  static async findById(id: number): Promise<any> {
    return await getOne(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
  }

  static async create(userData: UserData): Promise<number> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const userId = await insert('users', {
      username: userData.username,
      password_hash: hashedPassword,
      email: userData.email || null
    });
    
    return userId;
  }

  static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updatePassword(userId: number, newPassword: string): Promise<any> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Como não temos função update exportada, vamos usar query diretamente
    return await query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [hashedPassword, userId]
    );
  }
}