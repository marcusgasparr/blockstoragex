import { Router } from "express";
import { FileSystemController } from "../controllers/fileSystemController";

const router = Router();

// GET /api/files/directory?path=C:\Users - Obter conteúdo de um diretório
router.get("/directory", FileSystemController.getDirectoryContents);

// GET /api/files/starred?rootPath=H:\ - Buscar todos os favoritos do disco
router.get("/starred", FileSystemController.getAllStarredItems);

// POST /api/files/create-directory - Criar novo diretório
router.post("/create-directory", FileSystemController.createDirectory);

// DELETE /api/files/delete - Excluir arquivo ou diretório
router.delete("/delete", FileSystemController.deleteItem);

// PUT /api/files/rename - Renomear arquivo ou diretório
router.put("/rename", FileSystemController.renameItem);

// POST /api/files/move - Mover arquivo ou diretório
router.post("/move", FileSystemController.moveItem);

// POST /api/files/copy - Copiar arquivo ou diretório
router.post("/copy", FileSystemController.copyItem);

// POST /api/files/toggle-star - Favoritar/desfavoritar item
router.post("/toggle-star", FileSystemController.toggleStar);

// POST /api/files/set-folder-color - Definir cor da pasta
router.post("/set-folder-color", FileSystemController.setFolderColor);

// GET /api/files/read?path=C:\arquivo.txt - Ler conteúdo de arquivo
router.get("/read", FileSystemController.readFile);

// GET /api/files/read?path=C:\arquivo.txt - Ler conteúdo de arquivo
router.get("/read", FileSystemController.readFile);

// GET /api/files/download?path=C:\arquivo.txt - Download de arquivo
router.get("/download", FileSystemController.downloadFile);

// GET /api/files/search?query=arquivo&rootPath=H:\ - Buscar arquivos globalmente
router.get("/search", FileSystemController.searchFiles);

export default router;
