"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Favorite = void 0;
const db_1 = require("../db");
class Favorite {
    static async getUserFavorites(userId) {
        return await (0, db_1.query)('SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    }
    static async add(userId, filePath, fileName, fileType) {
        try {
            return await (0, db_1.insert)('favorites', {
                user_id: userId,
                file_path: filePath,
                file_name: fileName,
                file_type: fileType
            });
        }
        catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return { error: 'Already in favorites' };
            }
            throw error;
        }
    }
    static async remove(userId, filePath) {
        // Normaliza o caminho para evitar problemas de encoding ou barras
        const normalizedPath = filePath.trim();
        console.log('[Favorite.remove] userId:', userId, 'filePath:', filePath, 'normalizedPath:', normalizedPath);
        return await (0, db_1.query)('DELETE FROM favorites WHERE user_id = ? AND file_path = ?', [userId, normalizedPath]);
    }
    static async isFavorite(userId, filePath) {
        const result = await (0, db_1.query)('SELECT id FROM favorites WHERE user_id = ? AND file_path = ? LIMIT 1', [userId, filePath]);
        return Array.isArray(result) && result.length > 0;
    }
    // Estatísticas dos favoritos do usuário
    static async getStats(userId) {
        const favorites = await (0, db_1.query)('SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at DESC', [userId]);
        const total = favorites.length;
        const files = favorites.filter(f => f.file_type !== null && f.file_type !== '').length;
        const folders = favorites.filter(f => f.file_type === null || f.file_type === '').length;
        const oldest = favorites.length > 0 ? favorites[favorites.length - 1].created_at : null;
        const newest = favorites.length > 0 ? favorites[0].created_at : null;
        // Top tipos de arquivo
        const typeCount = {};
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
exports.Favorite = Favorite;
