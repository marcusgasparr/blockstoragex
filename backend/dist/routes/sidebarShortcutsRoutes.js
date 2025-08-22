"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sidebarShortcutsController_1 = require("../controllers/sidebarShortcutsController");
const router = (0, express_1.Router)();
// GET /api/sidebar-shortcuts/user/:userId - Buscar atalhos do usuário
router.get('/user/:userId', sidebarShortcutsController_1.SidebarShortcutsController.getUserShortcuts);
// POST /api/sidebar-shortcuts - Criar novo atalho
router.post('/', sidebarShortcutsController_1.SidebarShortcutsController.createShortcut);
// PUT /api/sidebar-shortcuts/:id - Atualizar atalho
router.put('/:id', sidebarShortcutsController_1.SidebarShortcutsController.updateShortcut);
// DELETE /api/sidebar-shortcuts/:id - Excluir atalho
router.delete('/:id', sidebarShortcutsController_1.SidebarShortcutsController.deleteShortcut);
// PUT /api/sidebar-shortcuts/reorder - Reordenar atalhos
router.put('/reorder', sidebarShortcutsController_1.SidebarShortcutsController.reorderShortcuts);
exports.default = router;
