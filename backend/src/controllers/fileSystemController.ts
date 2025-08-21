import { Request, Response } from "express";
import { FileSystemService } from "../services/fileSystemService";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";

// Configurar multer para upload (fora da classe)
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = req.body.path || "G:\\";
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      // Manter o nome original do arquivo
      cb(null, file.originalname);
    },
  }),
});

export class FileSystemController {
  // Endpoint para buscar todos os favoritos do disco
  static getAllStarredItems(req: Request, res: Response): void {
    try {
      const { rootPath } = req.query;
      const basePath = typeof rootPath === "string" ? rootPath : "H:\\";
      // Busca recursiva de favoritos
      const items = FileSystemService.getAllStarredItems();
      res.status(200).json({
        success: true,
        data: items,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Erro ao buscar favoritos",
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async getDirectoryContents(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { path: dirPath } = req.query;

      const contents = await FileSystemService.getDirectoryContents(
        dirPath as string
      );

      res.status(200).json({
        success: true,
        data: contents,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Erro no controller de file system:", error);

      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Erro interno do servidor",
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async createDirectory(req: Request, res: Response): Promise<void> {
    try {
      const { path: dirPath, name } = req.body;

      if (!dirPath || !name) {
        res.status(400).json({
          success: false,
          message: "Caminho e nome do diretório são obrigatórios",
        });
        return;
      }

      const result = await FileSystemService.createDirectory(dirPath, name);

      res.status(200).json({
        success: true,
        data: { created: result },
        message: "Diretório criado com sucesso",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Erro ao criar diretório:", error);

      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Erro ao criar diretório",
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async deleteItem(req: Request, res: Response): Promise<void> {
    try {
      const { path: itemPath } = req.body;

      if (!itemPath) {
        res.status(400).json({
          success: false,
          message: "Caminho do item é obrigatório",
        });
        return;
      }

      const result = await FileSystemService.deleteItem(itemPath);

      res.status(200).json({
        success: true,
        data: { deleted: result },
        message: "Item excluído com sucesso",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Erro ao excluir item:", error);

      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Erro ao excluir item",
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async renameItem(req: Request, res: Response): Promise<void> {
    try {
      const { path: itemPath, newName } = req.body;

      if (!itemPath || !newName) {
        res.status(400).json({
          success: false,
          message: "Caminho do item e novo nome são obrigatórios",
        });
        return;
      }

      const result = await FileSystemService.renameItem(itemPath, newName);

      res.status(200).json({
        success: true,
        data: { renamed: result },
        message: "Item renomeado com sucesso",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Erro ao renomear item:", error);

      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Erro ao renomear item",
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async moveItem(req: Request, res: Response): Promise<void> {
    try {
      const { sourcePath, destinationDir } = req.body;

      if (!sourcePath || !destinationDir) {
        res.status(400).json({
          success: false,
          message: "Caminho de origem e destino são obrigatórios",
        });
        return;
      }

      const result = await FileSystemService.moveItem(
        sourcePath,
        destinationDir
      );

      res.status(200).json({
        success: true,
        data: { moved: result },
        message: "Item movido com sucesso",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Erro ao mover item:", error);

      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Erro ao mover item",
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async copyItem(req: Request, res: Response): Promise<void> {
    try {
      const { sourcePath, destinationDir } = req.body;

      if (!sourcePath || !destinationDir) {
        res.status(400).json({
          success: false,
          message: "Caminho de origem e destino são obrigatórios",
        });
        return;
      }

      const result = await FileSystemService.copyItem(
        sourcePath,
        destinationDir
      );

      res.status(200).json({
        success: true,
        data: { copied: result },
        message: "Item copiado com sucesso",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Erro ao copiar item:", error);

      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Erro ao copiar item",
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async toggleStar(req: Request, res: Response): Promise<void> {
    try {
      const { path: itemPath } = req.body;

      if (!itemPath) {
        res.status(400).json({
          success: false,
          message: "Caminho do item é obrigatório",
        });
        return;
      }

      const result = await FileSystemService.toggleStar(itemPath);

      res.status(200).json({
        success: true,
        data: { starred: result },
        message: "Estado de favorito alterado com sucesso",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Erro ao favoritar item:", error);

      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Erro ao favoritar item",
        timestamp: new Date().toISOString(),
      });
    }
  }

  // método para ler arquivo
  static async readFile(req: Request, res: Response): Promise<void> {
    try {
      const { path: filePath } = req.query;

      if (!filePath) {
        res.status(400).json({
          success: false,
          message: "Caminho do arquivo é obrigatório",
        });
        return;
      }

      const content = await FileSystemService.readFile(filePath as string);

      res.status(200).json({
        success: true,
        data: content,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Erro ao ler arquivo:", error);

      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Erro ao ler arquivo",
        timestamp: new Date().toISOString(),
      });
    }
  }

  // método para download
  static async downloadFile(req: Request, res: Response): Promise<void> {
    try {
      const { path: filePath } = req.query;

      if (!filePath) {
        res.status(400).json({
          success: false,
          message: "Caminho do arquivo é obrigatório",
        });
        return;
      }

      await FileSystemService.downloadFile(filePath as string, res);
    } catch (error) {
      console.error("Erro ao fazer download:", error);

      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Erro ao fazer download",
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async searchFiles(req: Request, res: Response): Promise<void> {
    try {
      const { query, rootPath } = req.query;

      if (!query || !rootPath) {
        res.status(400).json({
          success: false,
          message: "Query e rootPath são obrigatórios",
        });
        return;
      }

      const results = await FileSystemService.searchFiles(
        query as string,
        rootPath as string
      );

      res.status(200).json({
        success: true,
        data: results,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Erro ao buscar arquivos:", error);

      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Erro ao buscar arquivos",
        timestamp: new Date().toISOString(),
      });
    }
  }
}

// Funções de upload exportadas separadamente (fora da classe)
export const uploadFile = [
  upload.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: "Nenhum arquivo fornecido",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          filename: req.file.filename,
          path: req.file.path,
          size: req.file.size,
        },
        message: "Arquivo enviado com sucesso",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Erro no upload:", error);

      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Erro no upload",
        timestamp: new Date().toISOString(),
      });
    }
  },
];

export const uploadFolder = [
  upload.array("file"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        res.status(400).json({
          success: false,
          message: "Nenhum arquivo fornecido",
        });
        return;
      }

      const uploadPath = req.body.path || "G:\\";
      const uploadedFiles = [];

      for (const file of files) {
        const relativePath = req.body.relativePath || file.originalname;
        const fullPath = path.join(uploadPath, relativePath);

        // Criar diretórios se necessário
        const dir = path.dirname(fullPath);
        await fs.mkdir(dir, { recursive: true });

        // Mover arquivo para o local correto
        await fs.rename(file.path, fullPath);

        uploadedFiles.push({
          filename: file.originalname,
          path: fullPath,
          size: file.size,
        });
      }

      res.status(200).json({
        success: true,
        data: {
          files: uploadedFiles,
          count: uploadedFiles.length,
        },
        message: "Pasta enviada com sucesso",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Erro no upload da pasta:", error);

      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Erro no upload da pasta",
        timestamp: new Date().toISOString(),
      });
    }
  },
];