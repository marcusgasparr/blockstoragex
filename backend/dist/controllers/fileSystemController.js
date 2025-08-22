"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFolder = exports.uploadFile = exports.FileSystemController = void 0;
const fileSystemService_1 = require("../services/fileSystemService");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = require("fs");
// Configurar multer para upload (fora da classe)
const upload = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
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
class FileSystemController {
    // Endpoint para buscar todos os favoritos do disco
    static getAllStarredItems(req, res) {
        try {
            const { rootPath } = req.query;
            const basePath = typeof rootPath === "string" ? rootPath : "H:\\";
            // Busca recursiva de favoritos
            const items = fileSystemService_1.FileSystemService.getAllStarredItems();
            res.status(200).json({
                success: true,
                data: items,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : "Erro ao buscar favoritos",
                timestamp: new Date().toISOString(),
            });
        }
    }
    static async getDirectoryContents(req, res) {
        try {
            const { path: dirPath } = req.query;
            const contents = await fileSystemService_1.FileSystemService.getDirectoryContents(dirPath);
            res.status(200).json({
                success: true,
                data: contents,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            console.error("Erro no controller de file system:", error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : "Erro interno do servidor",
                timestamp: new Date().toISOString(),
            });
        }
    }
    static async createDirectory(req, res) {
        try {
            const { path: dirPath, name } = req.body;
            if (!dirPath || !name) {
                res.status(400).json({
                    success: false,
                    message: "Caminho e nome do diretório são obrigatórios",
                });
                return;
            }
            const result = await fileSystemService_1.FileSystemService.createDirectory(dirPath, name);
            res.status(200).json({
                success: true,
                data: { created: result },
                message: "Diretório criado com sucesso",
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            console.error("Erro ao criar diretório:", error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : "Erro ao criar diretório",
                timestamp: new Date().toISOString(),
            });
        }
    }
    static async deleteItem(req, res) {
        const { path: itemPath, userId } = req.body;
        if (!itemPath) {
            res.status(400).json({
                success: false,
                message: "Caminho do item é obrigatório",
            });
            return;
        }
        let deleted = false;
        let errorMsg = null;
        try {
            deleted = await fileSystemService_1.FileSystemService.deleteItem(itemPath);
        }
        catch (error) {
            errorMsg = error instanceof Error ? error.message : String(error);
        }
        // Registrar log de exclusão (sempre)
        try {
            const { Log } = await Promise.resolve().then(() => __importStar(require('../lib/models/Log')));
            await Log.logAction({
                userId: userId || req.headers['x-user-id'] || null,
                actionType: 'DELETE',
                filePath: itemPath,
                fileName: itemPath.split(/[\\/]/).pop() || null,
                ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || null,
                userAgent: req.headers['user-agent'] || null,
                details: {
                    deletedAt: new Date().toISOString(),
                    status: deleted ? 'success' : 'fail',
                    error: errorMsg
                }
            });
        }
        catch (logError) {
            console.error('Erro ao registrar log de exclusão:', logError);
        }
        if (deleted) {
            res.status(200).json({
                success: true,
                data: { deleted: true },
                message: "Item excluído com sucesso",
                timestamp: new Date().toISOString(),
            });
        }
        else {
            res.status(404).json({
                success: false,
                message: errorMsg || "Item não encontrado",
                timestamp: new Date().toISOString(),
            });
        }
    }
    static async renameItem(req, res) {
        try {
            const { path: itemPath, newName } = req.body;
            if (!itemPath || !newName) {
                res.status(400).json({
                    success: false,
                    message: "Caminho do item e novo nome são obrigatórios",
                });
                return;
            }
            const result = await fileSystemService_1.FileSystemService.renameItem(itemPath, newName);
            res.status(200).json({
                success: true,
                data: { renamed: result },
                message: "Item renomeado com sucesso",
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            console.error("Erro ao renomear item:", error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : "Erro ao renomear item",
                timestamp: new Date().toISOString(),
            });
        }
    }
    static async moveItem(req, res) {
        try {
            const { sourcePath, destinationDir } = req.body;
            if (!sourcePath || !destinationDir) {
                res.status(400).json({
                    success: false,
                    message: "Caminho de origem e destino são obrigatórios",
                });
                return;
            }
            const result = await fileSystemService_1.FileSystemService.moveItem(sourcePath, destinationDir);
            res.status(200).json({
                success: true,
                data: { moved: result },
                message: "Item movido com sucesso",
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            console.error("Erro ao mover item:", error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : "Erro ao mover item",
                timestamp: new Date().toISOString(),
            });
        }
    }
    static async copyItem(req, res) {
        try {
            const { sourcePath, destinationDir } = req.body;
            if (!sourcePath || !destinationDir) {
                res.status(400).json({
                    success: false,
                    message: "Caminho de origem e destino são obrigatórios",
                });
                return;
            }
            const result = await fileSystemService_1.FileSystemService.copyItem(sourcePath, destinationDir);
            res.status(200).json({
                success: true,
                data: { copied: result },
                message: "Item copiado com sucesso",
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            console.error("Erro ao copiar item:", error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : "Erro ao copiar item",
                timestamp: new Date().toISOString(),
            });
        }
    }
    static async toggleStar(req, res) {
        try {
            const { path: itemPath } = req.body;
            if (!itemPath) {
                res.status(400).json({
                    success: false,
                    message: "Caminho do item é obrigatório",
                });
                return;
            }
            const result = await fileSystemService_1.FileSystemService.toggleStar(itemPath);
            res.status(200).json({
                success: true,
                data: { starred: result },
                message: "Estado de favorito alterado com sucesso",
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            console.error("Erro ao favoritar item:", error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : "Erro ao favoritar item",
                timestamp: new Date().toISOString(),
            });
        }
    }
    // método para ler arquivo
    static async readFile(req, res) {
        try {
            const { path: filePath } = req.query;
            if (!filePath) {
                res.status(400).json({
                    success: false,
                    message: "Caminho do arquivo é obrigatório",
                });
                return;
            }
            const content = await fileSystemService_1.FileSystemService.readFile(filePath);
            res.status(200).json({
                success: true,
                data: content,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            console.error("Erro ao ler arquivo:", error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : "Erro ao ler arquivo",
                timestamp: new Date().toISOString(),
            });
        }
    }
    // método para download
    static async downloadFile(req, res) {
        try {
            const { path: filePath } = req.query;
            if (!filePath) {
                res.status(400).json({
                    success: false,
                    message: "Caminho do arquivo é obrigatório",
                });
                return;
            }
            await fileSystemService_1.FileSystemService.downloadFile(filePath, res);
        }
        catch (error) {
            console.error("Erro ao fazer download:", error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : "Erro ao fazer download",
                timestamp: new Date().toISOString(),
            });
        }
    }
    static async searchFiles(req, res) {
        try {
            const { query, rootPath } = req.query;
            if (!query || !rootPath) {
                res.status(400).json({
                    success: false,
                    message: "Query e rootPath são obrigatórios",
                });
                return;
            }
            const results = await fileSystemService_1.FileSystemService.searchFiles(query, rootPath);
            res.status(200).json({
                success: true,
                data: results,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            console.error("Erro ao buscar arquivos:", error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : "Erro ao buscar arquivos",
                timestamp: new Date().toISOString(),
            });
        }
    }
}
exports.FileSystemController = FileSystemController;
// Funções de upload exportadas separadamente (fora da classe)
exports.uploadFile = [
    upload.single("file"),
    async (req, res) => {
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
        }
        catch (error) {
            console.error("Erro no upload:", error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : "Erro no upload",
                timestamp: new Date().toISOString(),
            });
        }
    },
];
exports.uploadFolder = [
    upload.array("file"),
    async (req, res) => {
        try {
            const files = req.files;
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
                const fullPath = path_1.default.join(uploadPath, relativePath);
                // Criar diretórios se necessário
                const dir = path_1.default.dirname(fullPath);
                await fs_1.promises.mkdir(dir, { recursive: true });
                // Mover arquivo para o local correto
                await fs_1.promises.rename(file.path, fullPath);
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
        }
        catch (error) {
            console.error("Erro no upload da pasta:", error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : "Erro no upload da pasta",
                timestamp: new Date().toISOString(),
            });
        }
    },
];
