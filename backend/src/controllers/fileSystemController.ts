import { Request, Response } from 'express';
import { FileSystemService } from '../services/fileSystemService';

export class FileSystemController {
  // Endpoint para buscar todos os favoritos do disco
  static getAllStarredItems(req: Request, res: Response): void {
    try {
      const { rootPath } = req.query;
      const basePath = typeof rootPath === 'string' ? rootPath : 'H:\\';
      // Busca recursiva de favoritos
  const items = FileSystemService.getAllStarredItems();
      res.status(200).json({
        success: true,
        data: items,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao buscar favoritos',
        timestamp: new Date().toISOString()
      });
    }
  }
  static async getDirectoryContents(req: Request, res: Response): Promise<void> {
    try {
      const { path: dirPath } = req.query;
      
      const contents = await FileSystemService.getDirectoryContents(dirPath as string);
      
      res.status(200).json({
        success: true,
        data: contents,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro no controller de file system:', error);
      
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro interno do servidor',
        timestamp: new Date().toISOString()
      });
    }
  }

  static async createDirectory(req: Request, res: Response): Promise<void> {
    try {
      const { path: dirPath, name } = req.body;
      
      if (!dirPath || !name) {
        res.status(400).json({
          success: false,
          message: 'Caminho e nome do diretório são obrigatórios'
        });
        return;
      }

      const result = await FileSystemService.createDirectory(dirPath, name);
      
      res.status(200).json({
        success: true,
        data: { created: result },
        message: 'Diretório criado com sucesso',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao criar diretório:', error);
      
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao criar diretório',
        timestamp: new Date().toISOString()
      });
    }
  }

  static async deleteItem(req: Request, res: Response): Promise<void> {
    try {
      const { path: itemPath } = req.body;
      
      if (!itemPath) {
        res.status(400).json({
          success: false,
          message: 'Caminho do item é obrigatório'
        });
        return;
      }

      const result = await FileSystemService.deleteItem(itemPath);
      
      res.status(200).json({
        success: true,
        data: { deleted: result },
        message: 'Item excluído com sucesso',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao excluir item:', error);
      
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao excluir item',
        timestamp: new Date().toISOString()
      });
    }
  }

  static async renameItem(req: Request, res: Response): Promise<void> {
    try {
      const { path: itemPath, newName } = req.body;
      
      if (!itemPath || !newName) {
        res.status(400).json({
          success: false,
          message: 'Caminho do item e novo nome são obrigatórios'
        });
        return;
      }

      const result = await FileSystemService.renameItem(itemPath, newName);
      
      res.status(200).json({
        success: true,
        data: { renamed: result },
        message: 'Item renomeado com sucesso',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao renomear item:', error);
      
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao renomear item',
        timestamp: new Date().toISOString()
      });
    }
  }

  static async moveItem(req: Request, res: Response): Promise<void> {
    try {
      const { sourcePath, destinationDir } = req.body;
      
      if (!sourcePath || !destinationDir) {
        res.status(400).json({
          success: false,
          message: 'Caminho de origem e destino são obrigatórios'
        });
        return;
      }

      const result = await FileSystemService.moveItem(sourcePath, destinationDir);
      
      res.status(200).json({
        success: true,
        data: { moved: result },
        message: 'Item movido com sucesso',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao mover item:', error);
      
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao mover item',
        timestamp: new Date().toISOString()
      });
    }
  }

  static async copyItem(req: Request, res: Response): Promise<void> {
    try {
      const { sourcePath, destinationDir } = req.body;
      
      if (!sourcePath || !destinationDir) {
        res.status(400).json({
          success: false,
          message: 'Caminho de origem e destino são obrigatórios'
        });
        return;
      }

      const result = await FileSystemService.copyItem(sourcePath, destinationDir);
      
      res.status(200).json({
        success: true,
        data: { copied: result },
        message: 'Item copiado com sucesso',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao copiar item:', error);
      
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao copiar item',
        timestamp: new Date().toISOString()
      });
    }
  }

  static async toggleStar(req: Request, res: Response): Promise<void> {
    try {
      const { path: itemPath } = req.body;
      
      if (!itemPath) {
        res.status(400).json({
          success: false,
          message: 'Caminho do item é obrigatório'
        });
        return;
      }

      const result = await FileSystemService.toggleStar(itemPath);
      
      res.status(200).json({
        success: true,
        data: { starred: result },
        message: 'Estado de favorito alterado com sucesso',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao favoritar item:', error);
      
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao favoritar item',
        timestamp: new Date().toISOString()
      });
    }
  }

  static async setFolderColor(req: Request, res: Response): Promise<void> {
    try {
      const { path: folderPath, color } = req.body;
      
      if (!folderPath || !color) {
        res.status(400).json({
          success: false,
          message: 'Caminho da pasta e cor são obrigatórios'
        });
        return;
      }

      const result = await FileSystemService.setFolderColor(folderPath, color);
      
      res.status(200).json({
        success: true,
        data: { colorSet: result },
        message: 'Cor da pasta alterada com sucesso',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao definir cor da pasta:', error);
      
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao definir cor da pasta',
        timestamp: new Date().toISOString()
      });
    }
  }
}