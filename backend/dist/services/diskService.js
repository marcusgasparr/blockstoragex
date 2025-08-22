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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiskService = void 0;
const si = __importStar(require("systeminformation"));
class DiskService {
    static async getDiskInfo() {
        try {
            console.log("🔍 Obtendo informações dos discos...");
            // Obtém informações dos discos
            const fsSize = await si.fsSize();
            console.log("📊 Discos encontrados:", fsSize.length);
            // Formata os dados para interface
            const disks = fsSize.map((disk) => ({
                filesystem: disk.fs,
                size: disk.size,
                used: disk.used,
                available: disk.available,
                capacity: Math.round((disk.used / disk.size) * 100),
                mountpoint: disk.mount,
                type: disk.type,
            }));
            // Calcula totais
            const totalSize = disks.reduce((sum, disk) => sum + disk.size, 0);
            const totalUsed = disks.reduce((sum, disk) => sum + disk.used, 0);
            const totalAvailable = disks.reduce((sum, disk) => sum + disk.available, 0);
            console.log("✅ Informações dos discos obtidas com sucesso");
            return {
                disks,
                totalSize,
                totalUsed,
                totalAvailable,
            };
        }
        catch (error) {
            console.error("💥 Erro ao obter informações do disco:", error);
            throw new Error("Falha ao obter informações do disco");
        }
    }
    static formatBytes(bytes) {
        if (bytes === 0)
            return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    }
    static async getSpecificDiskInfo(mountpoint = "C:\\") {
        try {
            console.log("🔍 Buscando disco específico:", mountpoint);
            const fsSize = await si.fsSize();
            console.log("📊 Discos disponíveis para busca:", fsSize.map((d) => ({ mount: d.mount, fs: d.fs })));
            // Procura pelo disco específico com lógica melhorada
            const specificDisk = fsSize.find((disk) => {
                // Normalizar caminhos para comparação
                const diskMount = disk.mount.toLowerCase().replace(/\//g, "\\");
                const targetMount = mountpoint.toLowerCase();
                console.log(`🔍 Comparando: "${diskMount}" com "${targetMount}"`);
                // Verificar várias possibilidades de match
                const matches = diskMount === targetMount ||
                    diskMount === targetMount + "\\" ||
                    diskMount + "\\" === targetMount ||
                    disk.fs
                        .toLowerCase()
                        .includes(targetMount.replace("\\", "").charAt(0));
                if (matches) {
                    console.log(`✅ Match encontrado: ${disk.mount} (${disk.fs})`);
                }
                return matches;
            });
            if (!specificDisk) {
                console.log("❌ Disco não encontrado");
                console.log("🔍 Discos disponíveis:", fsSize.map((d) => ({ mount: d.mount, fs: d.fs })));
                console.log("🎯 Procurando por:", mountpoint);
                return null;
            }
            console.log("✅ Disco específico encontrado:", specificDisk.mount);
            return {
                filesystem: specificDisk.fs,
                size: specificDisk.size,
                used: specificDisk.used,
                available: specificDisk.available,
                capacity: Math.round((specificDisk.used / specificDisk.size) * 100),
                mountpoint: specificDisk.mount,
                type: specificDisk.type,
            };
        }
        catch (error) {
            console.error("💥 Erro ao obter disco específico:", error);
            return null;
        }
    }
}
exports.DiskService = DiskService;
