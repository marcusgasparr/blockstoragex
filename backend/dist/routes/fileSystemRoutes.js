"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fileSystemController_1 = require("../controllers/fileSystemController");
const router = (0, express_1.Router)();
// GET /api/files/directory?path=C:\Users - Obter conteúdo de um diretório
router.get("/directory", fileSystemController_1.FileSystemController.getDirectoryContents);
// GET /api/files/starred?rootPath=H:\ - Buscar todos os favoritos do disco
router.get("/starred", fileSystemController_1.FileSystemController.getAllStarredItems);
// POST /api/files/create-directory - Criar novo diretório
router.post("/create-directory", fileSystemController_1.FileSystemController.createDirectory);
// DELETE /api/files/delete - Excluir arquivo ou diretório
router.delete("/delete", fileSystemController_1.FileSystemController.deleteItem);
// PUT /api/files/rename - Renomear arquivo ou diretório
router.put("/rename", fileSystemController_1.FileSystemController.renameItem);
// POST /api/files/move - Mover arquivo ou diretório
router.post("/move", fileSystemController_1.FileSystemController.moveItem);
// POST /api/files/copy - Copiar arquivo ou diretório
router.post("/copy", fileSystemController_1.FileSystemController.copyItem);
// POST /api/files/toggle-star - Favoritar/desfavoritar item
router.post("/toggle-star", fileSystemController_1.FileSystemController.toggleStar);
// GET /api/files/read?path=C:\arquivo.txt - Ler conteúdo de arquivo
router.get("/read", fileSystemController_1.FileSystemController.readFile);
// GET /api/files/download?path=C:\arquivo.txt - Download de arquivo
router.get("/download", fileSystemController_1.FileSystemController.downloadFile);
// GET /api/files/search?query=arquivo&rootPath=H:\ - Buscar arquivos globalmente
router.get("/search", fileSystemController_1.FileSystemController.searchFiles);
// POST /api/files/upload - Upload de arquivo
router.post("/upload", fileSystemController_1.uploadFile);
// POST /api/files/upload-folder - Upload de pasta
router.post("/upload-folder", fileSystemController_1.uploadFolder);
exports.default = router;
