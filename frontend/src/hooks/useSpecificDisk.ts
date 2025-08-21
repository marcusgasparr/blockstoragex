import { useState, useEffect } from "react";
import { diskService, DiskInfo } from "../services/diskService";

export const useSpecificDisk = (
  mountpoint: string = "G:\\",
  autoRefresh: boolean = false,
  refreshInterval: number = 30000
) => {
  const [diskInfo, setDiskInfo] = useState<DiskInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSpecificDisk = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("💾 useSpecificDisk: Buscando disco:", mountpoint);
      const data = await diskService.getSpecificDisk(mountpoint);
      setDiskInfo(data);
      console.log("✅ useSpecificDisk: Disco encontrado:", data?.mountpoint);
    } catch (err) {
      console.error("❌ useSpecificDisk: Erro ao buscar disco:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecificDisk();

    if (autoRefresh) {
      const interval = setInterval(fetchSpecificDisk, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [mountpoint, autoRefresh, refreshInterval]);

  // Effect para reagir a mudanças no localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "selectedDrive" && e.newValue !== mountpoint) {
        console.log(
          "🔄 useSpecificDisk: Detectada mudança no localStorage do disco"
        );
        fetchSpecificDisk();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [fetchSpecificDisk, mountpoint]);

  return {
    diskInfo,
    loading,
    error,
    refetch: fetchSpecificDisk,
  };
};
