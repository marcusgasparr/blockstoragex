"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settingsController_1 = require("../controllers/settingsController");
const router = (0, express_1.Router)();
// GET /api/settings/current-disk - Obter disco atual
router.get('/current-disk', settingsController_1.SettingsController.getCurrentDisk);
// PUT /api/settings/current-disk - Atualizar disco atual
router.put('/current-disk', settingsController_1.SettingsController.updateCurrentDisk);
// GET /api/settings/all - Obter todas as configurações
router.get('/all', settingsController_1.SettingsController.getAllSettings);
// PUT /api/settings/bulk - Atualizar múltiplas configurações
router.put('/bulk', settingsController_1.SettingsController.updateSettings);
exports.default = router;
