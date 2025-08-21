import * as fs from "fs";
import * as path from "path";

export interface FileSystemItem {
  name: string;
  path: string;
  type: "file" | "directory";
  size: number;
  modified: Date;
  extension?: string;
  icon: string;
  isStarred?: boolean;
  folderColor?: string;
}

export interface DirectoryContent {
  currentPath: string;
  parentPath: string | null;
  items: FileSystemItem[];
  totalItems: number;
}

export class FileSystemService {
  // Busca recursiva de todos os favoritos em todas as subpastas
  // Retorna todos os favoritos diretamente do Set, sem busca recursiva
  static getAllStarredItems(): FileSystemItem[] {
    const result: FileSystemItem[] = [];
    for (const filePath of this.favorites) {
      try {
        const stat = fs.statSync(filePath);
        result.push({
          name: path.basename(filePath),
          path: filePath,
          type: stat.isDirectory() ? "directory" : "file",
          size: stat.size,
          modified: stat.mtime,
          extension: stat.isFile() ? path.extname(filePath).toLowerCase() : undefined,
          icon: this.getFileIcon(path.basename(filePath), stat.isDirectory()),
          isStarred: true,
          folderColor: stat.isDirectory() ? this.folderColors.get(filePath) : undefined,
        });
      } catch (err) {
        // Se o arquivo não existe mais, ignora
        continue;
      }
    }
    return result;
  }
  // ...continuação da classe...
  // Diretórios permitidos para navegação (segurança)
  private static allowedPaths = [
    // 'C:\\Users',
    // 'C:\\Program Files',
    // 'C:\\Program Files (x86)',
    "D:\\",
    "E:\\",
    "E:\\Hotfix",
    "F:\\",
    "G:\\",
    "H:\\",
    // Adicione mais conforme necessário
  ];

  // Armazenamento simples para favoritos e cores (em produção usar banco de dados)
  private static favorites = new Set<string>();
  private static folderColors = new Map<string, string>();

  static async getDirectoryContents(
    dirPath: string = "C:\\Users"
  ): Promise<DirectoryContent> {
    try {
      // Verificação de segurança
      if (!this.isPathAllowed(dirPath)) {
        throw new Error("Acesso negado ao diretório especificado");
      }

      // Verificar se o diretório existe
      if (!fs.existsSync(dirPath)) {
        throw new Error("Diretório não encontrado");
      }

      const stat = fs.statSync(dirPath);
      if (!stat.isDirectory()) {
        throw new Error("Caminho especificado não é um diretório");
      }

      // Ler conteúdo do diretório
      const files = fs.readdirSync(dirPath);
      const items: FileSystemItem[] = [];

      for (const file of files) {
        try {
          const filePath = path.join(dirPath, file);
          const fileStat = fs.statSync(filePath);

          const item: FileSystemItem = {
            name: file,
            path: filePath,
            type: fileStat.isDirectory() ? "directory" : "file",
            size: fileStat.size,
            modified: fileStat.mtime,
            extension: fileStat.isFile()
              ? path.extname(file).toLowerCase()
              : undefined,
            icon: this.getFileIcon(file, fileStat.isDirectory()),
            isStarred: this.favorites.has(filePath),
            folderColor: fileStat.isDirectory()
              ? this.folderColors.get(filePath)
              : undefined,
          };

          items.push(item);
        } catch (error: any) {
          // Pular arquivos/pastas com erro de acesso (EPERM, etc.)
          // Apenas log silencioso para pastas protegidas do sistema
          if (error.code === "EPERM") {
            // console.log(`Ignorando pasta protegida: ${file}`);
          }
          continue; // Continua para o próximo arquivo sem adicionar este
        }
      }

      // Ordenar: diretórios primeiro, depois arquivos, ambos alfabeticamente
      items.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === "directory" ? -1 : 1;
        }
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      });

      const parentPath = this.getParentPath(dirPath);

      return {
        currentPath: dirPath,
        parentPath,
        items,
        totalItems: items.length,
      };
    } catch (error) {
      console.error("Erro ao ler diretório:", error);
      throw new Error(
        error instanceof Error ? error.message : "Erro ao ler diretório"
      );
    }
  }

  static async createDirectory(
    dirPath: string,
    name: string
  ): Promise<boolean> {
    try {
      if (!this.isPathAllowed(dirPath)) {
        throw new Error("Acesso negado ao diretório especificado");
      }

      const newDirPath = path.join(dirPath, name);
      fs.mkdirSync(newDirPath);
      return true;
    } catch (error) {
      console.error("Erro ao criar diretório:", error);
      throw new Error("Erro ao criar diretório");
    }
  }

  static async deleteItem(itemPath: string): Promise<boolean> {
    try {
      if (!this.isPathAllowed(path.dirname(itemPath))) {
        throw new Error("Acesso negado");
      }

      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        fs.rmSync(itemPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(itemPath);
      }

      return true;
    } catch (error) {
      console.error("Erro ao excluir item:", error);
      throw new Error("Erro ao excluir item");
    }
  }

  static async renameItem(oldPath: string, newName: string): Promise<boolean> {
    try {
      if (!this.isPathAllowed(path.dirname(oldPath))) {
        throw new Error("Acesso negado");
      }

      const newPath = path.join(path.dirname(oldPath), newName);
      fs.renameSync(oldPath, newPath);
      return true;
    } catch (error) {
      console.error("Erro ao renomear item:", error);
      throw new Error("Erro ao renomear item");
    }
  }

  static async moveItem(
    sourcePath: string,
    destinationDir: string
  ): Promise<boolean> {
    try {
      if (
        !this.isPathAllowed(path.dirname(sourcePath)) ||
        !this.isPathAllowed(destinationDir)
      ) {
        throw new Error("Acesso negado");
      }

      const fileName = path.basename(sourcePath);
      const newPath = path.join(destinationDir, fileName);

      fs.renameSync(sourcePath, newPath);
      return true;
    } catch (error) {
      console.error("Erro ao mover item:", error);
      throw new Error("Erro ao mover item");
    }
  }

  static async copyItem(
    sourcePath: string,
    destinationDir: string
  ): Promise<boolean> {
    try {
      if (
        !this.isPathAllowed(path.dirname(sourcePath)) ||
        !this.isPathAllowed(destinationDir)
      ) {
        throw new Error("Acesso negado");
      }

      const fileName = path.basename(sourcePath);
      const newPath = path.join(destinationDir, fileName);

      const stat = fs.statSync(sourcePath);

      if (stat.isDirectory()) {
        this.copyDirectoryRecursive(sourcePath, newPath);
      } else {
        fs.copyFileSync(sourcePath, newPath);
      }

      return true;
    } catch (error) {
      console.error("Erro ao copiar item:", error);
      throw new Error("Erro ao copiar item");
    }
  }

  private static copyDirectoryRecursive(
    source: string,
    destination: string
  ): void {
    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination);
    }

    const files = fs.readdirSync(source);

    for (const file of files) {
      const sourcePath = path.join(source, file);
      const destPath = path.join(destination, file);
      const stat = fs.statSync(sourcePath);

      if (stat.isDirectory()) {
        this.copyDirectoryRecursive(sourcePath, destPath);
      } else {
        fs.copyFileSync(sourcePath, destPath);
      }
    }
  }

  private static isPathAllowed(dirPath: string): boolean {
    // Normalizar o caminho
    const normalizedPath = path.resolve(dirPath);

    // Verificar se o caminho está na lista de permitidos
    return this.allowedPaths.some((allowedPath) => {
      const normalizedAllowed = path.resolve(allowedPath);

      // Permitir qualquer subpasta dentro dos caminhos permitidos
      // Também permitir o próprio caminho permitido
      return (
        normalizedPath.startsWith(normalizedAllowed) ||
        normalizedPath === normalizedAllowed
      );
    });
  }

  private static getParentPath(currentPath: string): string | null {
    const parent = path.dirname(currentPath);

    console.log("🔍 Debug getParentPath:");
    console.log("  currentPath:", currentPath);
    console.log("  parent:", parent);
    console.log("  root:", path.parse(currentPath).root);

    // Normalizar os caminhos para comparação
    const normalizedCurrent = path.resolve(currentPath);
    const normalizedParent = path.resolve(parent);
    const root = path.parse(currentPath).root;

    // Se o parent é igual ao current, significa que chegou na raiz absoluta
    if (normalizedParent === normalizedCurrent) {
      console.log("  → Retornando null (parent === current)");
      return null;
    }

    // CORREÇÃO: Remover a verificação de root para permitir voltar para H:\

    // Verificar se o parent é um caminho permitido
    if (!this.isPathAllowed(parent)) {
      console.log("  → Retornando null (parent não permitido)");
      return null;
    }

    console.log("  → Retornando parent válido:", parent);
    return parent;
  }

  private static getFileIcon(fileName: string, isDirectory: boolean): string {
    if (isDirectory) {
      return "fas fa-folder";
    }

    const extension = path.extname(fileName).toLowerCase();

    const iconMap: Record<string, string> = {
      ".pdf": "fas fa-file-pdf",
      ".doc": "fas fa-file-word",
      ".docx": "fas fa-file-word",
      ".xls": "fas fa-file-excel",
      ".xlsx": "fas fa-file-excel",
      ".ppt": "fas fa-file-powerpoint",
      ".pptx": "fas fa-file-powerpoint",
      ".txt": "fas fa-file-alt",
      ".jpg": "fas fa-file-image",
      ".jpeg": "fas fa-file-image",
      ".png": "fas fa-file-image",
      ".gif": "fas fa-file-image",
      ".bmp": "fas fa-file-image",
      ".svg": "fas fa-file-image",
      ".mp4": "fas fa-file-video",
      ".avi": "fas fa-file-video",
      ".mov": "fas fa-file-video",
      ".wmv": "fas fa-file-video",
      ".mp3": "fas fa-file-audio",
      ".wav": "fas fa-file-audio",
      ".flac": "fas fa-file-audio",
      ".zip": "fas fa-file-archive",
      ".rar": "fas fa-file-archive",
      ".7z": "fas fa-file-archive",
      ".tar": "fas fa-file-archive",
      ".js": "fas fa-file-code",
      ".ts": "fas fa-file-code",
      ".html": "fas fa-file-code",
      ".css": "fas fa-file-code",
      ".json": "fas fa-file-code",
      ".xml": "fas fa-file-code",
      ".exe": "fas fa-cog",
      ".msi": "fas fa-cog",
    };

    return iconMap[extension] || "fas fa-file";
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  static async toggleStar(itemPath: string): Promise<boolean> {
    try {
      if (!this.isPathAllowed(path.dirname(itemPath))) {
        throw new Error("Acesso negado");
      }

      if (this.favorites.has(itemPath)) {
        this.favorites.delete(itemPath);
        return false;
      } else {
        this.favorites.add(itemPath);
        return true;
      }
    } catch (error) {
      console.error("Erro ao favoritar item:", error);
      throw new Error("Erro ao favoritar item");
    }
  }

  static async setFolderColor(
    folderPath: string,
    color: string
  ): Promise<boolean> {
    try {
      if (!this.isPathAllowed(path.dirname(folderPath))) {
        throw new Error("Acesso negado");
      }

      // Verificar se é um diretório
      const stat = fs.statSync(folderPath);
      if (!stat.isDirectory()) {
        throw new Error("Caminho especificado não é um diretório");
      }

      // Validar cores permitidas
      const isHex = /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(color.trim());
      if (!isHex) {
        throw new Error("Cor inválida. Use formato HEX, ex: #1e90ff");
      }
      this.folderColors.set(folderPath, color);
      return true;
    } catch (error) {
      console.error("Erro ao definir cor da pasta:", error);
      throw new Error("Erro ao definir cor da pasta");
    }
  }
}
