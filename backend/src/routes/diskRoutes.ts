import { Router } from 'express';
import { DiskController } from '../controllers/diskController';

const router = Router();

// GET /api/disk/info - Obter informações básicas do disco
router.get('/info', DiskController.getDiskInfo);

// GET /api/disk/info-formatted - Obter informações formatadas do disco
router.get('/info-formatted', DiskController.getDiskInfoFormatted);

// GET /api/disk/specific?mountpoint=C:\
router.get('/specific', DiskController.getSpecificDisk);


export default router;
