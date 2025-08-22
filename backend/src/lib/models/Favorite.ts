import { query, insert } from '../db';

export class Favorite {
  static async getUserFavorites(userId: number) {
    return await query(
      'SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
  }

  static async add(
    userId: number,
    filePath: string,
    fileName: string,
    fileType: string
  ) {
    try {
      return await insert('favorites', {
        user_id: userId,
        file_path: filePath,
        file_name: fileName,
        file_type: fileType
      });
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        return { error: 'Already in favorites' };
      }
      throw error;
    }
  }

  static async remove(userId: number, filePath: string) {
    // Normaliza o caminho para evitar problemas de encoding ou barras
    const normalizedPath = filePath.trim();
    console.log('[Favorite.remove] userId:', userId, 'filePath:', filePath, 'normalizedPath:', normalizedPath);
    return await query(
      'DELETE FROM favorites WHERE user_id = ? AND file_path = ?',
      [userId, normalizedPath]
    );
  }

  static async isFavorite(userId: number, filePath: string) {
    const result = await query(
      'SELECT id FROM favorites WHERE user_id = ? AND file_path = ? LIMIT 1',
      [userId, filePath]
    );
    return Array.isArray(result) && result.length > 0;
  }
  
  // Estatísticas dos favoritos do usuário
  static async getStats(userId: number) {
    const favorites = await query(
      'SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    ) as Array<{ file_type: string | null, created_at: string }>;
    const total = favorites.length;
    const files = favorites.filter(f => f.file_type !== null && f.file_type !== '').length;
    const folders = favorites.filter(f => f.file_type === null || f.file_type === '').length;
    const oldest = favorites.length > 0 ? favorites[favorites.length - 1].created_at : null;
    const newest = favorites.length > 0 ? favorites[0].created_at : null;
    // Top tipos de arquivo
    const typeCount: Record<string, number> = {};
    favorites.forEach(f => {
      if (f.file_type) {
        typeCount[f.file_type] = (typeCount[f.file_type] || 0) + 1;
      }
    });
    const topTypes = Object.entries(typeCount)
      .map(([file_type, count]) => ({ file_type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    return { total, files, folders, oldest, newest, topTypes };
  }
}