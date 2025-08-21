import { Request, Response } from 'express';
import { DiskService } from '../services/diskService';

export class DiskController {
  static async getDiskInfo(req: Request, res: Response): Promise<void> {
    try {
      const diskInfo = await DiskService.getDiskInfo();
      
      res.status(200).json({
        success: true,
        data: diskInfo,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro no controller de disco:', error);
      
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao obter informações do disco',
        timestamp: new Date().toISOString()
      });
    }
  }

  static async getDiskInfoFormatted(req: Request, res: Response): Promise<void> {
    try {
      const diskInfo = await DiskService.getDiskInfo();
      
      // Formata os dados para exibição
      const formattedDisks = diskInfo.disks.map(disk => ({
        ...disk,
        sizeFormatted: DiskService.formatBytes(disk.size),
        usedFormatted: DiskService.formatBytes(disk.used),
        availableFormatted: DiskService.formatBytes(disk.available)
      }));

      res.status(200).json({
        success: true,
        data: {
          ...diskInfo,
          disks: formattedDisks,
          totalSizeFormatted: DiskService.formatBytes(diskInfo.totalSize),
          totalUsedFormatted: DiskService.formatBytes(diskInfo.totalUsed),
          totalAvailableFormatted: DiskService.formatBytes(diskInfo.totalAvailable)
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro no controller de disco:', error);
      
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao obter informações do disco',
        timestamp: new Date().toISOString()
      });
    }
  }

  static async getSpecificDisk(req: Request, res: Response): Promise<void> {
  try {
    const { mountpoint } = req.query;
    const diskInfo = await DiskService.getSpecificDiskInfo(mountpoint as string);
    
    if (!diskInfo) {
      res.status(404).json({
        success: false,
        message: 'Disco não encontrado'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        ...diskInfo,
        sizeFormatted: DiskService.formatBytes(diskInfo.size),
        usedFormatted: DiskService.formatBytes(diskInfo.used),
        availableFormatted: DiskService.formatBytes(diskInfo.available)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter disco específico'
    });
  }
}

}
