"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const logsController_1 = require("../controllers/logsController");
const router = (0, express_1.Router)();
// GET /api/logs?page=1
router.get('/', logsController_1.LogsController.getLogs);
exports.default = router;
