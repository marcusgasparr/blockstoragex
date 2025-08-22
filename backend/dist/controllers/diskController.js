"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiskController = void 0;
const diskService_1 = require("../services/diskService");
class DiskController {
    static async getDiskInfo(req, res) {
        try {
            const diskInfo = await diskService_1.DiskService.getDiskInfo();
            res.status(200).json({
                success: true,
                data: diskInfo,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            console.error("Erro no controller de disco:", error);
            res.status(500).json({
                success: false,
                message: "Erro interno do servidor ao obter informações do disco",
                timestamp: new Date().toISOString(),
            });
        }
    }
    static async getDiskInfoFormatted(req, res) {
        try {
            const diskInfo = await diskService_1.DiskService.getDiskInfo();
            // Formata os dados para exibição
            const formattedDisks = diskInfo.disks.map((disk) => ({
                ...disk,
                sizeFormatted: diskService_1.DiskService.formatBytes(disk.size),
                usedFormatted: diskService_1.DiskService.formatBytes(disk.used),
                availableFormatted: diskService_1.DiskService.formatBytes(disk.available),
            }));
            res.status(200).json({
                success: true,
                data: {
                    ...diskInfo,
                    disks: formattedDisks,
                    totalSizeFormatted: diskService_1.DiskService.formatBytes(diskInfo.totalSize),
                    totalUsedFormatted: diskService_1.DiskService.formatBytes(diskInfo.totalUsed),
                    totalAvailableFormatted: diskService_1.DiskService.formatBytes(diskInfo.totalAvailable),
                },
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            console.error("Erro no controller de disco:", error);
            res.status(500).json({
                success: false,
                message: "Erro interno do servidor ao obter informações do disco",
                timestamp: new Date().toISOString(),
            });
        }
    }
    static async getSpecificDisk(req, res) {
        try {
            const { mountpoint } = req.query;
            console.log("🔍 Buscando disco específico:", mountpoint);
            if (!mountpoint) {
                res.status(400).json({
                    success: false,
                    message: "Mountpoint é obrigatório",
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const diskInfo = await diskService_1.DiskService.getSpecificDiskInfo(mountpoint);
            if (!diskInfo) {
                console.log("❌ Disco não encontrado:", mountpoint);
                res.status(404).json({
                    success: false,
                    message: `Disco ${mountpoint} não encontrado`,
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            console.log("✅ Disco encontrado:", diskInfo.mountpoint);
            res.status(200).json({
                success: true,
                data: {
                    ...diskInfo,
                    sizeFormatted: diskService_1.DiskService.formatBytes(diskInfo.size),
                    usedFormatted: diskService_1.DiskService.formatBytes(diskInfo.used),
                    availableFormatted: diskService_1.DiskService.formatBytes(diskInfo.available),
                },
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            console.error("❌ Erro ao obter disco específico:", error);
            res.status(500).json({
                success: false,
                message: error instanceof Error
                    ? error.message
                    : "Erro ao obter disco específico",
                timestamp: new Date().toISOString(),
            });
        }
    }
}
exports.DiskController = DiskController;
