import { Request, Response } from 'express';
import { query, getOne } from '../lib/db';
import * as path from 'path';
import * as fs from 'fs';

interface FavoriteItem {
  id: number;
  user_id: number;
  file_path: string;
  file_name: string;
  file_type: string;
  created_at: string;
}

export class FavoritesController {
  // GET /api/favorites/user/:userId - Obter todos os favoritos de um usuário
  static async getUserFavorites(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { rootPath } = req.query;

      console.log('🌟 Buscando favoritos do usuário:', userId, 'rootPath:', rootPath);

      let whereClause = 'user_id = ?';
      let queryParams: any[] = [userId];

      // Se rootPath for fornecido, filtrar apenas favoritos desse disco/caminho
      if (rootPath) {
        whereClause += ' AND file_path LIKE ?';
        queryParams.push(`${rootPath}%`);
      }

      const favorites = await query(
        `SELECT id, file_path, file_name, file_type, created_at 
         FROM favorites 
         WHERE ${whereClause} 
         ORDER BY created_at DESC`,
        queryParams
      ) as FavoriteItem[];

      // Verificar se os arquivos ainda existem e adicionar informações extras
      const validFavorites = [];
      for (const favorite of favorites) {
        try {
          if (fs.existsSync(favorite.file_path)) {
            const stats = fs.statSync(favorite.file_path);
            validFavorites.push({
              ...favorite,
              exists: true,
              size: stats.size,
              modified: stats.mtime,
              isDirectory: stats.isDirectory()
            });
          } else {
            // Arquivo não existe mais, mas manter no retorno marcado como inexistente
            validFavorites.push({
              ...favorite,
              exists: false,
              size: 0,
              modified: null,
              isDirectory: false
            });
          }
        } catch (error) {
          console.error('❌ Erro ao verificar arquivo favorito:', favorite.file_path, error);
          validFavorites.push({
            ...favorite,
            exists: false,
            size: 0,
            modified: null,
            isDirectory: false
          });
        }
      }

      console.log('✅ Favoritos encontrados:', validFavorites.length);

      res.json({
        success: true,
        data: validFavorites,
        count: validFavorites.length
      });

    } catch (error) {
      console.error('❌ Erro ao buscar favoritos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar favoritos',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  // POST /api/favorites/toggle - Adicionar/remover favorito
  static async toggleFavorite(req: Request, res: Response) {
    try {
      const { userId, filePath, fileName, fileType } = req.body;

      if (!userId || !filePath) {
        return res.status(400).json({
          success: false,
          message: 'userId e filePath são obrigatórios'
        });
      }

      console.log('⭐ Alternando favorito:', { userId, filePath, fileName, fileType });

      // Verificar se já existe
      const existingFavorite = await getOne(
        'SELECT id FROM favorites WHERE user_id = ? AND file_path = ?',
        [userId, filePath]
      );

      let action: 'added' | 'removed';
      let favoriteId: number;

      if (existingFavorite) {
        // Remove favorito
        await query(
          'DELETE FROM favorites WHERE user_id = ? AND file_path = ?',
          [userId, filePath]
        );
        action = 'removed';
        favoriteId = existingFavorite.id;
        console.log('🗑️ Favorito removido');
      } else {
        // Adiciona favorito
        const result = await query(
          'INSERT INTO favorites (user_id, file_path, file_name, file_type) VALUES (?, ?, ?, ?)',
          [userId, filePath, fileName || path.basename(filePath), fileType || path.extname(filePath)]
        ) as any;
        action = 'added';
        favoriteId = result.insertId;
        console.log('⭐ Favorito adicionado');
      }

      res.json({
        success: true,
        data: {
          action,
          favoriteId,
          isFavorite: action === 'added'
        },
        message: action === 'added' ? 'Arquivo adicionado aos favoritos' : 'Arquivo removido dos favoritos'
      });

    } catch (error) {
      console.error('❌ Erro ao alternar favorito:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao alternar favorito',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  // GET /api/favorites/check/:userId - Verificar se um arquivo específico é favorito
  static async checkFavorite(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { filePath } = req.query;

      if (!filePath) {
        return res.status(400).json({
          success: false,
          message: 'filePath é obrigatório'
        });
      }

      console.log('🔍 Verificando se é favorito:', { userId, filePath });

      const favorite = await getOne(
        'SELECT id, created_at FROM favorites WHERE user_id = ? AND file_path = ?',
        [userId, filePath]
      );

      res.json({
        success: true,
        data: {
          isFavorite: !!favorite,
          favoriteId: favorite?.id || null,
          createdAt: favorite?.created_at || null
        }
      });

    } catch (error) {
      console.error('❌ Erro ao verificar favorito:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao verificar favorito',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  // GET /api/favorites/batch-check/:userId - Verificar múltiplos arquivos de uma vez
  static async batchCheckFavorites(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { filePaths } = req.body;

      if (!Array.isArray(filePaths)) {
        return res.status(400).json({
          success: false,
          message: 'filePaths deve ser um array'
        });
      }

      console.log('🔍 Verificação em lote de favoritos:', { userId, count: filePaths.length });

      // Criar placeholders para a query
      const placeholders = filePaths.map(() => '?').join(',');
      const favorites = await query(
        `SELECT file_path, id, created_at FROM favorites 
         WHERE user_id = ? AND file_path IN (${placeholders})`,
        [userId, ...filePaths]
      ) as { file_path: string; id: number; created_at: string }[];

      // Criar mapa de resultados
      const results: Record<string, { isFavorite: boolean; favoriteId: number | null; createdAt: string | null }> = {};
      
      filePaths.forEach(filePath => {
        results[filePath] = {
          isFavorite: false,
          favoriteId: null,
          createdAt: null
        };
      });

      favorites.forEach(favorite => {
        results[favorite.file_path] = {
          isFavorite: true,
          favoriteId: favorite.id,
          createdAt: favorite.created_at
        };
      });

      res.json({
        success: true,
        data: results,
        count: favorites.length
      });

    } catch (error) {
      console.error('❌ Erro na verificação em lote:', error);
      res.status(500).json({
        success: false,
        message: 'Erro na verificação em lote',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  // DELETE /api/favorites/cleanup/:userId - Remover favoritos de arquivos que não existem mais
  static async cleanupFavorites(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      console.log('🧹 Limpando favoritos orfãos do usuário:', userId);

      const favorites = await query(
        'SELECT id, file_path FROM favorites WHERE user_id = ?',
        [userId]
      ) as { id: number; file_path: string }[];

      const orphanedIds: number[] = [];

      for (const favorite of favorites) {
        if (!fs.existsSync(favorite.file_path)) {
          orphanedIds.push(favorite.id);
        }
      }

      if (orphanedIds.length > 0) {
        const placeholders = orphanedIds.map(() => '?').join(',');
        await query(
          `DELETE FROM favorites WHERE id IN (${placeholders})`,
          orphanedIds
        );
      }

      console.log('✅ Limpeza concluída:', orphanedIds.length, 'favoritos orfãos removidos');

      res.json({
        success: true,
        data: {
          removedCount: orphanedIds.length,
          totalChecked: favorites.length
        },
        message: `${orphanedIds.length} favoritos orfãos removidos`
      });

    } catch (error) {
      console.error('❌ Erro na limpeza de favoritos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro na limpeza de favoritos',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  // GET /api/favorites/stats/:userId - Estatísticas dos favoritos
  static async getFavoriteStats(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      console.log('📊 Obtendo estatísticas de favoritos do usuário:', userId);

      const stats = await query(
        `SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN file_type LIKE '.%' THEN 1 END) as files,
          COUNT(CASE WHEN file_type = '' OR file_type IS NULL THEN 1 END) as folders,
          MIN(created_at) as oldest,
          MAX(created_at) as newest
        FROM favorites 
        WHERE user_id = ?`,
        [userId]
      ) as any[];

      const typeStats = await query(
        `SELECT file_type, COUNT(*) as count 
        FROM favorites 
        WHERE user_id = ? AND file_type != ''
        GROUP BY file_type 
        ORDER BY count DESC 
        LIMIT 10`,
        [userId]
      ) as { file_type: string; count: number }[];

      res.json({
        success: true,
        data: {
          total: stats[0]?.total || 0,
          files: stats[0]?.files || 0,
          folders: stats[0]?.folders || 0,
          oldest: stats[0]?.oldest,
          newest: stats[0]?.newest,
          topTypes: typeStats
        }
      });

    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao obter estatísticas',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }
}