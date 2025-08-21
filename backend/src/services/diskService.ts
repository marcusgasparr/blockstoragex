import * as si from "systeminformation";
import * as fs from "fs";
import * as path from "path";

export interface DiskInfo {
  filesystem: string;
  size: number;
  used: number;
  available: number;
  capacity: number;
  mountpoint: string;
  type: string;
}

export interface SystemDiskInfo {
  disks: DiskInfo[];
  totalSize: number;
  totalUsed: number;
  totalAvailable: number;
}

export class DiskService {
  static async getDiskInfo(): Promise<SystemDiskInfo> {
    try {
      console.log("🔍 Obtendo informações dos discos...");

      // Obtém informações dos discos
      const fsSize = await si.fsSize();
      console.log("📊 Discos encontrados:", fsSize.length);

      // Formata os dados para interface
      const disks: DiskInfo[] = fsSize.map((disk) => ({
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
      const totalAvailable = disks.reduce(
        (sum, disk) => sum + disk.available,
        0
      );

      console.log("✅ Informações dos discos obtidas com sucesso");

      return {
        disks,
        totalSize,
        totalUsed,
        totalAvailable,
      };
    } catch (error) {
      console.error("💥 Erro ao obter informações do disco:", error);
      throw new Error("Falha ao obter informações do disco");
    }
  }

  static formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  static async getSpecificDiskInfo(
    mountpoint: string = "C:\\"
  ): Promise<DiskInfo | null> {
    try {
      console.log("🔍 Buscando disco específico:", mountpoint);

      const fsSize = await si.fsSize();
      console.log(
        "📊 Discos disponíveis para busca:",
        fsSize.map((d) => ({ mount: d.mount, fs: d.fs }))
      );

      // Procura pelo disco específico com lógica melhorada
      const specificDisk = fsSize.find((disk) => {
        // Normalizar caminhos para comparação
        const diskMount = disk.mount.toLowerCase().replace(/\//g, "\\");
        const targetMount = mountpoint.toLowerCase();

        console.log(`🔍 Comparando: "${diskMount}" com "${targetMount}"`);

        // Verificar várias possibilidades de match
        const matches =
          diskMount === targetMount ||
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
        console.log(
          "🔍 Discos disponíveis:",
          fsSize.map((d) => ({ mount: d.mount, fs: d.fs }))
        );
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
    } catch (error) {
      console.error("💥 Erro ao obter disco específico:", error);
      return null;
    }
  }
}
