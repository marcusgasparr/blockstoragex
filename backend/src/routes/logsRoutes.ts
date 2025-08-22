import { Router } from 'express';
import { LogsController } from '../controllers/logsController';

const router = Router();

// GET /api/logs?page=1
router.get('/', LogsController.getLogs);

export default router;
