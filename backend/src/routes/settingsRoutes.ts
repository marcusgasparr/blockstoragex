import { Router } from 'express';
import { SettingsController } from '../controllers/settingsController';

const router = Router();

// GET /api/settings/current-disk - Obter disco atual
router.get('/current-disk', SettingsController.getCurrentDisk);

// PUT /api/settings/current-disk - Atualizar disco atual
router.put('/current-disk', SettingsController.updateCurrentDisk);

// GET /api/settings/all - Obter todas as configurações
router.get('/all', SettingsController.getAllSettings);

// PUT /api/settings/bulk - Atualizar múltiplas configurações
router.put('/bulk', SettingsController.updateSettings);

export default router;