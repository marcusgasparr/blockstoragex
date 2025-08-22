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
