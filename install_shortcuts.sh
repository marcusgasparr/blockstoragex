#!/bin/bash

echo "🚀 Aplicando alterações para funcionalidade de atalhos do sidebar..."

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Função para criar diretório se não existir
create_dir_if_not_exists() {
    if [ ! -d "$1" ]; then
        mkdir -p "$1"
        echo -e "${BLUE}📁 Diretório criado: $1${NC}"
    fi
}

# Verificar se estamos no diretório correto (verificação mais flexível)
if [ ! -d "frontend" ] && [ ! -d "backend" ]; then
    echo -e "${RED}❌ Execute este script em um diretório que contenha as pastas 'frontend' e 'backend'${NC}"
    echo -e "${BLUE}💡 Diretório atual: $(pwd)${NC}"
    echo -e "${BLUE}💡 Conteúdo: $(ls -la)${NC}"
    exit 1
fi

echo -e "${BLUE}📂 Criando diretórios necessários...${NC}"

# Criar diretórios necessários
create_dir_if_not_exists "backend/src/lib/models"
create_dir_if_not_exists "backend/src/controllers"
create_dir_if_not_exists "backend/src/routes"
create_dir_if_not_exists "frontend/src/services"
create_dir_if_not_exists "frontend/src/hooks"
create_dir_if_not_exists "frontend/src/layouts/PopupCreateShortcut"

echo -e "${BLUE}📝 Criando arquivos backend...${NC}"

# 1. Backend - Model SidebarShortcut
cat > backend/src/lib/models/SidebarShortcut.ts << 'EOF'
import { db } from '../database';
import { RowDataPacket } from 'mysql2';

export interface SidebarShortcutData {
  id?: number;
  user_id: number;
  shortcut_name: string;
  shortcut_path: string;
  icon?: string;
  sort_order?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export class SidebarShortcut {
  /**
   * Buscar todos os atalhos de um usuário
   */
  static async getUserShortcuts(userId: number): Promise<SidebarShortcutData[]> {
    const query = `
      SELECT 
        id, user_id, shortcut_name, shortcut_path, 
        icon, sort_order, is_active, created_at, updated_at
      FROM sidebarShortcuts 
      WHERE user_id = ? AND is_active = true
      ORDER BY sort_order ASC, created_at ASC
    `;
    
    const [rows] = await db.execute<RowDataPacket[]>(query, [userId]);
    return rows as SidebarShortcutData[];
  }

  /**
   * Criar novo atalho
   */
  static async create(shortcutData: Omit<SidebarShortcutData, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const {
      user_id,
      shortcut_name,
      shortcut_path,
      icon = 'fas fa-external-link-alt',
      sort_order = 0,
      is_active = true
    } = shortcutData;

    const query = `
      INSERT INTO sidebarShortcuts 
      (user_id, shortcut_name, shortcut_path, icon, sort_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute<any>(query, [
      user_id,
      shortcut_name,
      shortcut_path,
      icon,
      sort_order,
      is_active
    ]);

    return result.insertId;
  }

  /**
   * Atualizar atalho existente
   */
  static async update(id: number, userId: number, data: Partial<SidebarShortcutData>): Promise<boolean> {
    const allowedFields = ['shortcut_name', 'shortcut_path', 'icon', 'sort_order', 'is_active'];
    const updateFields = Object.keys(data).filter(key => allowedFields.includes(key));
    
    if (updateFields.length === 0) {
      throw new Error('Nenhum campo válido para atualizar');
    }

    const setClause = updateFields.map(field => `${field} = ?`).join(', ');
    const values = updateFields.map(field => data[field as keyof SidebarShortcutData]);
    
    const query = `
      UPDATE sidebarShortcuts 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `;

    const [result] = await db.execute<any>(query, [...values, id, userId]);
    return result.affectedRows > 0;
  }

  /**
   * Excluir atalho (soft delete)
   */
  static async delete(id: number, userId: number): Promise<boolean> {
    const query = `
      UPDATE sidebarShortcuts 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `;

    const [result] = await db.execute<any>(query, [id, userId]);
    return result.affectedRows > 0;
  }

  /**
   * Reordenar atalhos
   */
  static async reorder(userId: number, shortcutIds: number[]): Promise<boolean> {
    try {
      await db.execute('START TRANSACTION');

      for (let i = 0; i < shortcutIds.length; i++) {
        const query = `
          UPDATE sidebarShortcuts 
          SET sort_order = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND user_id = ?
        `;
        await db.execute(query, [i + 1, shortcutIds[i], userId]);
      }

      await db.execute('COMMIT');
      return true;
    } catch (error) {
      await db.execute('ROLLBACK');
      throw error;
    }
  }

  /**
   * Verificar se um atalho pertence a um usuário
   */
  static async belongsToUser(id: number, userId: number): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count 
      FROM sidebarShortcuts 
      WHERE id = ? AND user_id = ? AND is_active = true
    `;

    const [rows] = await db.execute<RowDataPacket[]>(query, [id, userId]);
    return rows[0].count > 0;
  }

  /**
   * Obter próximo sort_order para um usuário
   */
  static async getNextSortOrder(userId: number): Promise<number> {
    const query = `
      SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order
      FROM sidebarShortcuts 
      WHERE user_id = ? AND is_active = true
    `;

    const [rows] = await db.execute<RowDataPacket[]>(query, [userId]);
    return rows[0].next_order;
  }
}
EOF

echo -e "${GREEN}✅ SidebarShortcut.ts criado${NC}"

# 2. Backend - Controller
cat > backend/src/controllers/sidebarShortcutsController.ts << 'EOF'
import { Request, Response } from 'express';
import { SidebarShortcut, SidebarShortcutData } from '../lib/models/SidebarShortcut';

export class SidebarShortcutsController {
  /**
   * GET /api/sidebar-shortcuts/user/:userId
   * Buscar todos os atalhos de um usuário
   */
  static async getUserShortcuts(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: 'ID do usuário inválido'
        });
      }

      const shortcuts = await SidebarShortcut.getUserShortcuts(userId);
      
      res.json({
        success: true,
        data: shortcuts
      });
    } catch (error) {
      console.error('Erro ao buscar atalhos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * POST /api/sidebar-shortcuts
   * Criar novo atalho
   */
  static async createShortcut(req: Request, res: Response) {
    try {
      const { user_id, shortcut_name, shortcut_path, icon } = req.body;

      // Validações
      if (!user_id || !shortcut_name || !shortcut_path) {
        return res.status(400).json({
          success: false,
          message: 'Campos obrigatórios: user_id, shortcut_name, shortcut_path'
        });
      }

      // Validar se o nome do atalho não está vazio
      if (shortcut_name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Nome do atalho não pode estar vazio'
        });
      }

      // Validar URL básica
      try {
        new URL(shortcut_path);
      } catch {
        return res.status(400).json({
          success: false,
          message: 'URL inválida. Use um formato como: https://exemplo.com'
        });
      }

      // Obter próximo sort_order
      const sort_order = await SidebarShortcut.getNextSortOrder(user_id);

      const shortcutData: Omit<SidebarShortcutData, 'id' | 'created_at' | 'updated_at'> = {
        user_id,
        shortcut_name: shortcut_name.trim(),
        shortcut_path: shortcut_path.trim(),
        icon: icon || 'fas fa-external-link-alt',
        sort_order,
        is_active: true
      };

      const shortcutId = await SidebarShortcut.create(shortcutData);

      res.status(201).json({
        success: true,
        data: {
          id: shortcutId,
          ...shortcutData
        },
        message: 'Atalho criado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao criar atalho:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * PUT /api/sidebar-shortcuts/:id
   * Atualizar atalho existente
   */
  static async updateShortcut(req: Request, res: Response) {
    try {
      const shortcutId = parseInt(req.params.id);
      const { user_id, shortcut_name, shortcut_path, icon, sort_order } = req.body;

      if (isNaN(shortcutId)) {
        return res.status(400).json({
          success: false,
          message: 'ID do atalho inválido'
        });
      }

      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: 'user_id é obrigatório'
        });
      }

      // Verificar se o atalho pertence ao usuário
      const belongsToUser = await SidebarShortcut.belongsToUser(shortcutId, user_id);
      if (!belongsToUser) {
        return res.status(404).json({
          success: false,
          message: 'Atalho não encontrado'
        });
      }

      // Preparar dados para atualização
      const updateData: Partial<SidebarShortcutData> = {};
      
      if (shortcut_name !== undefined) {
        if (shortcut_name.trim().length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Nome do atalho não pode estar vazio'
          });
        }
        updateData.shortcut_name = shortcut_name.trim();
      }

      if (shortcut_path !== undefined) {
        try {
          new URL(shortcut_path);
          updateData.shortcut_path = shortcut_path.trim();
        } catch {
          return res.status(400).json({
            success: false,
            message: 'URL inválida'
          });
        }
      }

      if (icon !== undefined) updateData.icon = icon;
      if (sort_order !== undefined) updateData.sort_order = sort_order;

      const updated = await SidebarShortcut.update(shortcutId, user_id, updateData);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Atalho não encontrado ou não foi possível atualizar'
        });
      }

      res.json({
        success: true,
        message: 'Atalho atualizado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao atualizar atalho:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * DELETE /api/sidebar-shortcuts/:id
   * Excluir atalho
   */
  static async deleteShortcut(req: Request, res: Response) {
    try {
      const shortcutId = parseInt(req.params.id);
      const { user_id } = req.body;

      if (isNaN(shortcutId)) {
        return res.status(400).json({
          success: false,
          message: 'ID do atalho inválido'
        });
      }

      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: 'user_id é obrigatório'
        });
      }

      const deleted = await SidebarShortcut.delete(shortcutId, user_id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Atalho não encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Atalho excluído com sucesso'
      });
    } catch (error) {
      console.error('Erro ao excluir atalho:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * PUT /api/sidebar-shortcuts/reorder
   * Reordenar atalhos
   */
  static async reorderShortcuts(req: Request, res: Response) {
    try {
      const { user_id, shortcut_ids } = req.body;

      if (!user_id || !Array.isArray(shortcut_ids)) {
        return res.status(400).json({
          success: false,
          message: 'user_id e shortcut_ids (array) são obrigatórios'
        });
      }

      // Validar que todos os IDs são números
      const validIds = shortcut_ids.every(id => Number.isInteger(id));
      if (!validIds) {
        return res.status(400).json({
          success: false,
          message: 'Todos os IDs devem ser números inteiros'
        });
      }

      await SidebarShortcut.reorder(user_id, shortcut_ids);

      res.json({
        success: true,
        message: 'Atalhos reordenados com sucesso'
      });
    } catch (error) {
      console.error('Erro ao reordenar atalhos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}
EOF

echo -e "${GREEN}✅ sidebarShortcutsController.ts criado${NC}"

# 3. Backend - Routes
cat > backend/src/routes/sidebarShortcutsRoutes.ts << 'EOF'
import { Router } from 'express';
import { SidebarShortcutsController } from '../controllers/sidebarShortcutsController';

const router = Router();

// GET /api/sidebar-shortcuts/user/:userId - Buscar atalhos do usuário
router.get('/user/:userId', SidebarShortcutsController.getUserShortcuts);

// POST /api/sidebar-shortcuts - Criar novo atalho
router.post('/', SidebarShortcutsController.createShortcut);

// PUT /api/sidebar-shortcuts/:id - Atualizar atalho
router.put('/:id', SidebarShortcutsController.updateShortcut);

// DELETE /api/sidebar-shortcuts/:id - Excluir atalho
router.delete('/:id', SidebarShortcutsController.deleteShortcut);

// PUT /api/sidebar-shortcuts/reorder - Reordenar atalhos
router.put('/reorder', SidebarShortcutsController.reorderShortcuts);

export default router;
EOF

echo -e "${GREEN}✅ sidebarShortcutsRoutes.ts criado${NC}"

# 4. Atualizar app.ts
echo -e "${BLUE}📝 Atualizando app.ts...${NC}"

# Backup do app.ts original
cp backend/src/app.ts backend/src/app.ts.backup

# Atualizar app.ts para incluir as rotas
cat > backend/src/app.ts << 'EOF'
import express from 'express';
import cors from 'cors';
import diskRoutes from './routes/diskRoutes';
import fileSystemRoutes from './routes/fileSystemRoutes';
import settingsRoutes from './routes/settingsRoutes';
import favoritesDbRoutes from './routes/favoritesRoutes';
import sidebarShortcutsRoutes from './routes/sidebarShortcutsRoutes';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/disk', diskRoutes);
app.use('/api/files', fileSystemRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/favorites-db', favoritesDbRoutes);
app.use('/api/sidebar-shortcuts', sidebarShortcutsRoutes);

// Rota de teste
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'BlockStorageX API funcionando',
    timestamp: new Date().toISOString()
  });
});

// Middleware de erro
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor'
  });
});

export default app;
EOF

echo -e "${GREEN}✅ app.ts atualizado (backup criado em app.ts.backup)${NC}"

echo -e "${BLUE}📝 Criando arquivos frontend...${NC}"

# 5. Frontend - Service
cat > frontend/src/services/sidebarShortcutsService.ts << 'EOF'
export interface SidebarShortcutData {
  id?: number;
  user_id: number;
  shortcut_name: string;
  shortcut_path: string;
  icon?: string;
  sort_order?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateShortcutData {
  shortcut_name: string;
  shortcut_path: string;
  icon?: string;
}

const API_BASE_URL = 'http://localhost:3001/api/sidebar-shortcuts';

class SidebarShortcutsService {
  /**
   * Buscar todos os atalhos de um usuário
   */
  async getUserShortcuts(userId: number = 1): Promise<SidebarShortcutData[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/user/${userId}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Erro ao buscar atalhos');
      }

      return data.data || [];
    } catch (error) {
      console.error('Erro ao buscar atalhos:', error);
      throw error;
    }
  }

  /**
   * Criar novo atalho
   */
  async createShortcut(shortcutData: CreateShortcutData, userId: number = 1): Promise<SidebarShortcutData> {
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          ...shortcutData
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Erro ao criar atalho');
      }

      return data.data;
    } catch (error) {
      console.error('Erro ao criar atalho:', error);
      throw error;
    }
  }

  /**
   * Atualizar atalho existente
   */
  async updateShortcut(
    shortcutId: number, 
    updateData: Partial<CreateShortcutData>, 
    userId: number = 1
  ): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/${shortcutId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          ...updateData
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Erro ao atualizar atalho');
      }
    } catch (error) {
      console.error('Erro ao atualizar atalho:', error);
      throw error;
    }
  }

  /**
   * Excluir atalho
   */
  async deleteShortcut(shortcutId: number, userId: number = 1): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/${shortcutId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Erro ao excluir atalho');
      }
    } catch (error) {
      console.error('Erro ao excluir atalho:', error);
      throw error;
    }
  }

  /**
   * Reordenar atalhos
   */
  async reorderShortcuts(shortcutIds: number[], userId: number = 1): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          shortcut_ids: shortcutIds
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Erro ao reordenar atalhos');
      }
    } catch (error) {
      console.error('Erro ao reordenar atalhos:', error);
      throw error;
    }
  }
}

export const sidebarShortcutsService = new SidebarShortcutsService();
EOF

echo -e "${GREEN}✅ sidebarShortcutsService.ts criado${NC}"

# 6. Frontend - Hook
cat > frontend/src/hooks/useSidebarShortcuts.ts << 'EOF'
import { useState, useEffect, useCallback } from 'react';
import { 
  sidebarShortcutsService, 
  SidebarShortcutData, 
  CreateShortcutData 
} from '../services/sidebarShortcutsService';

interface UseSidebarShortcutsReturn {
  shortcuts: SidebarShortcutData[];
  loading: boolean;
  error: string | null;
  createShortcut: (data: CreateShortcutData) => Promise<boolean>;
  updateShortcut: (id: number, data: Partial<CreateShortcutData>) => Promise<boolean>;
  deleteShortcut: (id: number) => Promise<boolean>;
  reorderShortcuts: (shortcutIds: number[]) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export const useSidebarShortcuts = (userId: number = 1): UseSidebarShortcutsReturn => {
  const [shortcuts, setShortcuts] = useState<SidebarShortcutData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para carregar atalhos
  const loadShortcuts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await sidebarShortcutsService.getUserShortcuts(userId);
      setShortcuts(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar atalhos';
      setError(errorMessage);
      console.error('Erro ao carregar atalhos:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Carregar atalhos na inicialização
  useEffect(() => {
    loadShortcuts();
  }, [loadShortcuts]);

  // Função para criar atalho
  const createShortcut = useCallback(async (data: CreateShortcutData): Promise<boolean> => {
    try {
      setError(null);
      await sidebarShortcutsService.createShortcut(data, userId);
      await loadShortcuts(); // Recarregar lista
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar atalho';
      setError(errorMessage);
      console.error('Erro ao criar atalho:', err);
      return false;
    }
  }, [userId, loadShortcuts]);

  // Função para atualizar atalho
  const updateShortcut = useCallback(async (
    id: number, 
    data: Partial<CreateShortcutData>
  ): Promise<boolean> => {
    try {
      setError(null);
      await sidebarShortcutsService.updateShortcut(id, data, userId);
      await loadShortcuts(); // Recarregar lista
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar atalho';
      setError(errorMessage);
      console.error('Erro ao atualizar atalho:', err);
      return false;
    }
  }, [userId, loadShortcuts]);

  // Função para excluir atalho
  const deleteShortcut = useCallback(async (id: number): Promise<boolean> => {
    try {
      setError(null);
      await sidebarShortcutsService.deleteShortcut(id, userId);
      await loadShortcuts(); // Recarregar lista
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir atalho';
      setError(errorMessage);
      console.error('Erro ao excluir atalho:', err);
      return false;
    }
  }, [userId, loadShortcuts]);

  // Função para reordenar atalhos
  const reorderShortcuts = useCallback(async (shortcutIds: number[]): Promise<boolean> => {
    try {
      setError(null);
      await sidebarShortcutsService.reorderShortcuts(shortcutIds, userId);
      await loadShortcuts(); // Recarregar lista
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao reordenar atalhos';
      setError(errorMessage);
      console.error('Erro ao reordenar atalhos:', err);
      return false;
    }
  }, [userId, loadShortcuts]);

  // Função para refresh manual
  const refresh = useCallback(async () => {
    await loadShortcuts();
  }, [loadShortcuts]);

  return {
    shortcuts,
    loading,
    error,
    createShortcut,
    updateShortcut,
    deleteShortcut,
    reorderShortcuts,
    refresh
  };
};
EOF

echo -e "${GREEN}✅ useSidebarShortcuts.ts criado${NC}"

# 7. Frontend - Popup Component TSX  
cat > frontend/src/layouts/PopupCreateShortcut/PopupCreateShortcut.tsx << 'EOF'
import React, { useState, useEffect } from 'react';
import styles from './PopupCreateShortcut.module.scss';

interface PopupCreateShortcutProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string, url: string) => void;
  initialName?: string;
  initialUrl?: string;
}

const PopupCreateShortcut: React.FC<PopupCreateShortcutProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialName = '',
  initialUrl = ''
}) => {
  const [shortcutName, setShortcutName] = useState(initialName);
  const [shortcutUrl, setShortcutUrl] = useState(initialUrl);
  const [errors, setErrors] = useState<{ name?: string; url?: string }>({});

  // Reset form quando abrir/fechar
  useEffect(() => {
    if (isOpen) {
      setShortcutName(initialName);
      setShortcutUrl(initialUrl);
      setErrors({});
    }
  }, [isOpen, initialName, initialUrl]);

  const validateForm = (): boolean => {
    const newErrors: { name?: string; url?: string } = {};

    // Validar nome
    if (!shortcutName.trim()) {
      newErrors.name = 'Nome do atalho é obrigatório';
    } else if (shortcutName.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    }

    // Validar URL
    if (!shortcutUrl.trim()) {
      newErrors.url = 'URL é obrigatória';
    } else {
      try {
        new URL(shortcutUrl.trim());
      } catch {
        newErrors.url = 'URL inválida. Use formato: https://exemplo.com';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onConfirm(shortcutName.trim(), shortcutUrl.trim());
      handleClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  const handleClose = () => {
    setShortcutName('');
    setShortcutUrl('');
    setErrors({});
    onClose();
  };

  // Auto-completar https:// se não tiver protocolo
  const handleUrlBlur = () => {
    if (shortcutUrl && !shortcutUrl.match(/^https?:\/\//)) {
      setShortcutUrl(`https://${shortcutUrl}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>
            <i className="fas fa-external-link-alt"></i>
            Criar Atalho
          </h3>
          <button 
            className={styles.closeBtn} 
            onClick={handleClose}
            type="button"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="shortcut-name" className={styles.label}>
              Nome do Atalho
            </label>
            <input
              id="shortcut-name"
              type="text"
              placeholder="Ex: GitHub, Google Drive, etc."
              value={shortcutName}
              onChange={(e) => setShortcutName(e.target.value)}
              onKeyDown={handleKeyDown}
              className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
              autoFocus
            />
            {errors.name && (
              <span className={styles.errorText}>
                <i className="fas fa-exclamation-circle"></i>
                {errors.name}
              </span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="shortcut-url" className={styles.label}>
              URL do Site
            </label>
            <input
              id="shortcut-url"
              type="url"
              placeholder="https://exemplo.com"
              value={shortcutUrl}
              onChange={(e) => setShortcutUrl(e.target.value)}
              onBlur={handleUrlBlur}
              onKeyDown={handleKeyDown}
              className={`${styles.input} ${errors.url ? styles.inputError : ''}`}
            />
            {errors.url && (
              <span className={styles.errorText}>
                <i className="fas fa-exclamation-circle"></i>
                {errors.url}
              </span>
            )}
          </div>
          
          <div className={styles.actions}>
            <button type="button" onClick={handleClose} className={styles.cancelBtn}>
              Cancelar
            </button>
            <button type="submit" className={styles.confirmBtn}>
              <i className="fas fa-plus"></i>
              Criar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PopupCreateShortcut;
EOF

echo -e "${GREEN}✅ PopupCreateShortcut.tsx criado${NC}"

# 8. Frontend - Popup Component SCSS
cat > frontend/src/layouts/PopupCreateShortcut/PopupCreateShortcut.module.scss << 'EOF'
@use "../../styles/variables.scss" as *;

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(2px);
}

.popup {
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  width: 450px;
  max-width: 95vw;
  overflow: hidden;
  animation: popupAppear 0.3s ease-out;
  border: 1px solid var(--border-light);
}

@keyframes popupAppear {
  from {
    transform: scale(0.9) translateY(-20px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-light);
  background: var(--bg-secondary);

  .title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 10px;

    i {
      color: var(--primary-color);
      font-size: 16px;
    }
  }

  .closeBtn {
    background: none;
    border: none;
    color: var(--text-secondary);
    font-size: 18px;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: var(--transition-fast);

    &:hover {
      background: var(--bg-hover);
      color: var(--text-primary);
    }
  }
}

.form {
  padding: 24px;
}

.inputGroup {
  margin-bottom: 20px;

  &:last-of-type {
    margin-bottom: 24px;
  }
}

.label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--border-light);
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-primary);
  background: var(--bg-secondary);
  box-sizing: border-box;
  transition: var(--transition-fast);

  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
  }

  &::placeholder {
    color: var(--text-muted);
  }

  &.inputError {
    border-color: var(--danger-color);

    &:focus {
      border-color: var(--danger-color);
      box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
    }
  }
}

.errorText {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--danger-color);
  font-size: 12px;
  font-weight: 500;
  margin-top: 6px;

  i {
    font-size: 11px;
  }
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;

  button {
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: var(--transition-fast);
    border: none;
    min-width: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .cancelBtn {
    background: var(--bg-secondary);
    color: var(--text-secondary);
    border: 1px solid var(--border-light);

    &:hover:not(:disabled) {
      background: var(--bg-hover);
      color: var(--text-primary);
      border-color: var(--border-hover);
    }
  }

  .confirmBtn {
    background: var(--primary-color);
    color: white;

    &:hover:not(:disabled) {
      background: var(--primary-hover);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
    }

    i {
      font-size: 13px;
    }
  }
}

// Responsividade
@media (max-width: 480px) {
  .popup {
    width: 350px;
    margin: 20px;
  }

  .header,
  .form {
    padding: 16px 20px;
  }

  .actions {
    flex-direction: column;

    button {
      width: 100%;
      min-width: auto;
    }
  }

  .title {
    font-size: 16px;
  }
}
EOF

echo -e "${GREEN}✅ PopupCreateShortcut.module.scss criado${NC}"

echo -e "${BLUE}📝 Atualizando Sidebar.tsx...${NC}"

# 9. Backup do Sidebar.tsx original
cp frontend/src/layouts/Sidebar/Sidebar.tsx frontend/src/layouts/Sidebar/Sidebar.tsx.backup

# 10. Atualizar Sidebar.tsx
cat > frontend/src/layouts/Sidebar/Sidebar.tsx << 'EOF'
import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Sidebar.module.scss';
import { useSpecificDisk } from '../../hooks/useSpecificDisk';
import PopupInputNewFolder from '../PopupInputNewFolder/PopupInputNewFolder';
import PopupCreateShortcut from '../PopupCreateShortcut/PopupCreateShortcut';
import { useSidebarShortcuts } from '../../hooks/useSidebarShortcuts';

interface SidebarProps {
  currentDrive?: string;
}
const Sidebar: React.FC<SidebarProps> = ({ currentDrive }) => {

  // Hook para obter informações do disco selecionado
  const selectedDrive = currentDrive || localStorage.getItem('selectedDrive') || 'G:\\';
  console.log('📊 Sidebar usando disco:', selectedDrive);
  console.log('📊 Sidebar recebeu currentDrive prop:', currentDrive);

  const { diskInfo, loading } = useSpecificDisk(selectedDrive);

  // Estado para o dropdown e popup
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNewFolderPopup, setShowNewFolderPopup] = useState(false);
  const [showCreateShortcutPopup, setShowCreateShortcutPopup] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Hook para gerenciar atalhos
  const { shortcuts, createShortcut, deleteShortcut } = useSidebarShortcuts();

  // Calcular porcentagem de uso
  const usagePercentage = diskInfo ? diskInfo.capacity : 0;

  const location = useLocation(); // Saber em qual página está

  const navigationItems = [
    { icon: 'fas fa-folder', label: 'Meu Drive', path: '/' },
    { icon: 'fas fa-clock', label: 'Recentes', path: '/recentes' },
    { icon: 'fas fa-star', label: 'Com estrela', path: '/favoritos' },
    // { icon: 'fas fa-trash', label: 'Lixeira', path: '/lixeira' },
  ];

  // Função para determinar o caminho de upload
  const getUploadPath = () => {
    // Se estiver na página MyDrive (raiz), usar o caminho atual
    if (location.pathname === '/') {
      return localStorage.getItem('currentPath') || selectedDrive;
    }
    // Se estiver em outras páginas, fazer upload na raiz do disco
    return selectedDrive;
  };

  // Handlers para as ações do dropdown
  const handleNewFolder = () => {
    setShowDropdown(false);
    setShowNewFolderPopup(true);
  };

  const handleCreateShortcut = () => {
    setShowDropdown(false);
    setShowCreateShortcutPopup(true);
  };

  const handleShortcutCreate = async (name: string, url: string) => {
    const success = await createShortcut({
      shortcut_name: name,
      shortcut_path: url
    });

    if (success) {
      console.log('Atalho criado com sucesso!');
    }
  };

  const handleShortcutClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShortcutDelete = async (shortcutId: number) => {
    if (window.confirm('Tem certeza que deseja excluir este atalho?')) {
      const success = await deleteShortcut(shortcutId);
      if (success) {
        console.log('Atalho excluído com sucesso!');
      }
    }
  };

  const handleCreateFolder = async (name: string) => {
    try {
      const uploadPath = getUploadPath();
      const response = await fetch('http://localhost:3001/api/files/create-directory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: uploadPath,
          name: name
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Recarregar a página atual se estiver no MyDrive
        if (location.pathname === '/') {
          window.location.reload();
        }
      } else {
        alert('Erro ao criar pasta: ' + data.message);
      }
    } catch (error) {
      console.error('Erro ao criar pasta:', error);
      alert('Erro ao criar pasta');
    }
  };

  const handleFileUpload = () => {
    setShowDropdown(false);
    fileInputRef.current?.click();
  };

  const handleFolderUpload = () => {
    setShowDropdown(false);
    folderInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const uploadPath = getUploadPath();

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', uploadPath);

      try {
        const response = await fetch('http://localhost:3001/api/files/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!data.success) {
          alert(`Erro ao fazer upload de ${file.name}: ${data.message}`);
          break;
        }
      } catch (error) {
        console.error('Erro no upload:', error);
        alert(`Erro ao fazer upload de ${file.name}`);
        break;
      }
    }

    // Recarregar a página atual se estiver no MyDrive
    if (location.pathname === '/') {
      setTimeout(() => window.location.reload(), 1000);
    }

    // Limpar o input
    event.target.value = '';
  };

  const handleFolderChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const uploadPath = getUploadPath();

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', uploadPath);
      formData.append('relativePath', file.webkitRelativePath);

      try {
        const response = await fetch('http://localhost:3001/api/files/upload-folder', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!data.success) {
          alert(`Erro ao fazer upload de pasta: ${data.message}`);
          break;
        }
      } catch (error) {
        console.error('Erro no upload da pasta:', error);
        alert('Erro ao fazer upload da pasta');
        break;
      }
    }

    // Recarregar a página atual se estiver no MyDrive
    if (location.pathname === '/') {
      setTimeout(() => window.location.reload(), 1000);
    }

    // Limpar o input
    event.target.value = '';
  };

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(`.${styles.newButton}`)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.newButton}>
        <button
          className={styles.newBtn}
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <i className="fas fa-plus"></i>
          Novo
          <i className={`fas fa-chevron-${showDropdown ? 'up' : 'down'} ${styles.chevron}`}></i>
        </button>

        {showDropdown && (
          <div className={styles.dropdown}>
            <button onClick={handleNewFolder} className={styles.dropdownItem}>
              <i className="fas fa-folder-plus"></i>
              <span>Nova pasta</span>
            </button>
            <button onClick={handleFileUpload} className={styles.dropdownItem}>
              <i className="fas fa-file-upload"></i>
              <span>Upload de arquivo</span>
            </button>
            <button onClick={handleFolderUpload} className={styles.dropdownItem}>
              <i className="fas fa-folder-upload"></i>
              <span>Upload de pasta</span>
            </button>
            <div className={styles.separator}></div>
            <button onClick={handleCreateShortcut} className={styles.dropdownItem}>
              <i className="fas fa-external-link-alt"></i>
              <span>Criar Atalho</span>
            </button>
          </div>
        )}

        {/* Inputs escondidos para upload */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <input
          ref={folderInputRef}
          type="file"
          {...({ webkitdirectory: "" } as any)}
          style={{ display: 'none' }}
          onChange={handleFolderChange}
        />
      </div>

      <nav className={styles.navigation}>
        {navigationItems.map((item, index) => (
          <Link
            key={index}
            to={item.path}
            className={`${styles.navItem} ${location.pathname === item.path ? styles.active : ''}`}
          >
            <i className={`${styles.icon} ${item.icon}`}></i>
            <span className={styles.label}>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Seção de atalhos personalizados */}
      {shortcuts.length > 0 && (
        <div className={styles.shortcuts}>
          <div className={styles.shortcutsHeader}>
            <span className={styles.shortcutsTitle}>Atalhos</span>
          </div>
          <div className={styles.shortcutsList}>
            {shortcuts.map((shortcut) => (
              <div
                key={shortcut.id}
                className={styles.shortcutItem}
                onClick={() => handleShortcutClick(shortcut.shortcut_path)}
                title={shortcut.shortcut_path}
              >
                <i className={`${styles.shortcutIcon} ${shortcut.icon || 'fas fa-external-link-alt'}`}></i>
                <span className={styles.shortcutLabel}>{shortcut.shortcut_name}</span>
                <button
                  className={styles.shortcutDeleteBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (shortcut.id) handleShortcutDelete(shortcut.id);
                  }}
                  title="Excluir atalho"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.storage}>
        <div className={styles.storageInfo}>
          <p className={styles.storageText}>
            {loading ? 'Carregando...' :
              diskInfo ? `${diskInfo.usedFormatted} de ${diskInfo.sizeFormatted} usados` :
                'Erro ao carregar dados'}
          </p>
          <div className={styles.storageBar}>
            <div
              className={styles.storageProgress}
              style={{
                width: `${usagePercentage}%`,
                backgroundColor: usagePercentage > 90 ? '#ff4757' :
                  usagePercentage > 70 ? '#ffa502' : '#2ed573'
              }}
            ></div>
          </div>
        </div>
        <span className={styles.descriptionBtn}>Desenvolvido por Marcus Gaspar®</span>
      </div>

      {/* Popup para nova pasta */}
      <PopupInputNewFolder
        isOpen={showNewFolderPopup}
        title="Nova pasta"
        placeholder="Digite o nome da pasta"
        confirmText="Criar"
        onClose={() => setShowNewFolderPopup(false)}
        onConfirm={handleCreateFolder}
      />

      {/* Popup para criar atalho */}
      <PopupCreateShortcut
        isOpen={showCreateShortcutPopup}
        onClose={() => setShowCreateShortcutPopup(false)}
        onConfirm={handleShortcutCreate}
      />
    </aside>
  );
};

export default Sidebar;
EOF

echo -e "${GREEN}✅ Sidebar.tsx atualizado (backup criado em Sidebar.tsx.backup)${NC}"

echo -e "${BLUE}📝 Atualizando Sidebar.module.scss...${NC}"

# 11. Backup do SCSS original
cp frontend/src/layouts/Sidebar/Sidebar.module.scss frontend/src/layouts/Sidebar/Sidebar.module.scss.backup

# 12. Adicionar estilos para atalhos no Sidebar.module.scss
cat >> frontend/src/layouts/Sidebar/Sidebar.module.scss << 'EOF'

// Separador no dropdown
.separator {
  height: 1px;
  background: var(--border-light);
  margin: 4px 0;
}

// Seção de atalhos personalizados
.shortcuts {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--border-light);

  .shortcutsHeader {
    padding: 0 16px;

    .shortcutsTitle {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  }

  .shortcutsList {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .shortcutItem {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 16px;
    border-radius: var(--border-radius);
    color: var(--text-secondary);
    font-size: 14px;
    cursor: pointer;
    transition: var(--transition-fast);
    position: relative;

    &:hover {
      background-color: var(--bg-hover);
      color: var(--text-primary);

      .shortcutDeleteBtn {
        opacity: 1;
        visibility: visible;
      }
    }

    .shortcutIcon {
      font-size: 14px;
      width: 20px;
      text-align: center;
      color: var(--primary-color);
    }

    .shortcutLabel {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .shortcutDeleteBtn {
      opacity: 0;
      visibility: hidden;
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 12px;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: var(--transition-fast);
      margin-left: auto;

      &:hover {
        background: var(--danger-color);
        color: white;
      }
    }
  }
}
EOF

echo -e "${GREEN}✅ Sidebar.module.scss atualizado (backup criado em Sidebar.module.scss.backup)${NC}"

echo ""
echo -e "${BLUE}🎉 INSTALAÇÃO CONCLUÍDA COM SUCESSO! 🎉${NC}"
echo ""
echo -e "${GREEN}📋 Resumo das alterações:${NC}"
echo -e "  ✅ Backend: Model, Controller e Routes criados"
echo -e "  ✅ Frontend: Service, Hook e Componente criados"
echo -e "  ✅ Sidebar atualizado com funcionalidade de atalhos"
echo -e "  ✅ Backups criados para arquivos modificados"
echo ""
echo -e "${BLUE}🚀 Próximos passos:${NC}"
echo -e "  1. Reinicie o backend: ${GREEN}npm run dev${NC} (na pasta backend)"
echo -e "  2. Reinicie o frontend: ${GREEN}npm start${NC} (na pasta frontend)"
echo -e "  3. Teste a funcionalidade: Clique em '+ Novo' > 'Criar Atalho'"
echo ""
echo -e "${BLUE}💡 Funcionalidades implementadas:${NC}"
echo -e "  📌 Criar atalhos através do botão '+ Novo'"
echo -e "  📌 Atalhos salvos no banco de dados"
echo -e "  📌 Atalhos exibidos no sidebar"
echo -e "  📌 Clique no atalho abre link em nova aba"
echo -e "  📌 Botão para excluir atalhos"
echo ""
echo -e "${GREEN}Tudo pronto! 🎯${NC}"