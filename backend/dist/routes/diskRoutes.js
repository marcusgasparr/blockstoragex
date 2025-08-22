"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const diskController_1 = require("../controllers/diskController");
const router = (0, express_1.Router)();
// GET /api/disk/info - Obter informações básicas do disco
router.get('/info', diskController_1.DiskController.getDiskInfo);
// GET /api/disk/info-formatted - Obter informações formatadas do disco
router.get('/info-formatted', diskController_1.DiskController.getDiskInfoFormatted);
// GET /api/disk/specific?mountpoint=C:\
router.get('/specific', diskController_1.DiskController.getSpecificDisk);
exports.default = router;
