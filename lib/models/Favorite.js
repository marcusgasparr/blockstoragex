import { query, insert, remove } from '../db';

export class Favorite {
  static async getUserFavorites(userId) {
    return await query(
      'SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
  }

  static async add(userId, filePath, fileName, fileType) {
    try {
      return await insert('favorites', {
        user_id: userId,
        file_path: filePath,
        file_name: fileName,
        file_type: fileType
      });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return { error: 'Already in favorites' };
      }
      throw error;
    }
  }

  static async remove(userId, filePath) {
    return await remove(
      'favorites',
      'user_id = ? AND file_path = ?',
      [userId, filePath]
    );
  }

  static async isFavorite(userId, filePath) {
    const result = await query(
      'SELECT id FROM favorites WHERE user_id = ? AND file_path = ? LIMIT 1',
      [userId, filePath]
    );
    return result.length > 0;
  }
}