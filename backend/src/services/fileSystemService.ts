import * as fs from 'fs';
import * as path from 'path';

export interface FileSystemItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
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
  // Cache para favoritos e cores
  private static favorites = new Set<string>();
  private static folderColors = new Map<string, string>();

  static async getDirectoryContents(dirPath: string = "H:\\"): Promise<DirectoryContent> {
    try {
      console.log('🔍 Tentando acessar diretório:', dirPath);
      

      // Corrige caminho para disco C montado no Docker
      let normalizedPath = path.resolve(dirPath);
  // ...existing code...
      // Se começar com /app/C, remove qualquer barra invertida ou barra após /app/C
      if (process.platform === 'linux' && normalizedPath.startsWith('/app/C')) {
        normalizedPath = normalizedPath.replace(/\/app\/C(:?\\|\/)+$/, '/app/C');
        normalizedPath = normalizedPath.replace(/\\/g, '/');
        // Se terminar com qualquer barra, remove
        normalizedPath = normalizedPath.replace(/\/app\/C\/+$/, '/app/C');
      }
      // Se vier C:\algumaCoisa, converte para /app/C/algumaCoisa
      if (process.platform === 'linux' && normalizedPath.match(/^C:(\\|\/)/i)) {
        normalizedPath = normalizedPath.replace(/^C:(\\|\/)?/i, '/app/C/').replace(/\\/g, '/');
        normalizedPath = normalizedPath.replace(/\/app\/C\/$/, '/app/C');
      }
      console.log('📁 Caminho normalizado:', normalizedPath);

      if (!this.isPathAllowed(normalizedPath)) {
        console.log('❌ Acesso negado ao diretório:', normalizedPath);
        throw new Error("Acesso negado ao diretório especificado");
      }

      if (!fs.existsSync(normalizedPath)) {
        console.log('❌ Diretório não encontrado:', normalizedPath);
        throw new Error("Diretório não encontrado");
      }

      const stat = fs.statSync(normalizedPath);
      if (!stat.isDirectory()) {
        console.log('❌ Não é um diretório:', normalizedPath);
        throw new Error("O caminho especificado não é um diretório");
      }

      console.log('📂 Lendo conteúdo do diretório...');
      const files = fs.readdirSync(normalizedPath);
      console.log(`📋 Encontrados ${files.length} itens`);

      const items: FileSystemItem[] = [];

      for (const file of files) {
        try {
          const filePath = path.join(normalizedPath, file);
          const fileStat = fs.statSync(filePath);

          const item: FileSystemItem = {
            name: file,
            path: filePath,
            type: fileStat.isDirectory() ? 'directory' : 'file',
            size: fileStat.size,
            modified: fileStat.mtime,
            extension: fileStat.isFile() ? path.extname(file).toLowerCase() : undefined,
            icon: this.getFileIcon(file, fileStat.isDirectory()),
            isStarred: this.favorites.has(filePath),
            folderColor: fileStat.isDirectory() ? this.folderColors.get(filePath) : undefined,
          };

          items.push(item);
        } catch (error: any) {
          console.warn(`⚠️ Erro ao acessar ${file}:`, error.message);
          continue;
        }
      }

      items.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1;
        }
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      });

      const parentPath = this.getParentPath(normalizedPath);

      return {
        currentPath: normalizedPath,
        parentPath,
        items,
        totalItems: items.length,
      };
    } catch (error) {
      console.error('💥 Erro ao obter conteúdo do diretório:', error);
      throw error;
    }
  }

  static async createDirectory(parentPath: string, name: string): Promise<boolean> {
    try {
      const newDirPath = path.join(parentPath, name);

      if (!this.isPathAllowed(newDirPath)) {
        throw new Error('Acesso negado ao local especificado');
      }

      if (fs.existsSync(newDirPath)) {
        throw new Error('Diretório já existe');
      }

      fs.mkdirSync(newDirPath);
      return true;
    } catch (error) {
      console.error('Erro ao criar diretório:', error);
      throw error;
    }
  }

  static async deleteItem(itemPath: string): Promise<boolean> {
    try {
      if (!this.isPathAllowed(itemPath)) {
        throw new Error('Acesso negado ao item especificado');
      }

      if (!fs.existsSync(itemPath)) {
        throw new Error('Item não encontrado');
      }

      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        fs.rmSync(itemPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(itemPath);
      }

      this.favorites.delete(itemPath);
      this.folderColors.delete(itemPath);

      return true;
    } catch (error) {
      console.error('Erro ao excluir item:', error);
      throw error;
    }
  }

  static async renameItem(itemPath: string, newName: string): Promise<boolean> {
    try {
      if (!this.isPathAllowed(itemPath)) {
        throw new Error('Acesso negado ao item especificado');
      }

      if (!fs.existsSync(itemPath)) {
        throw new Error('Item não encontrado');
      }

      const parentDir = path.dirname(itemPath);
      const newPath = path.join(parentDir, newName);

      if (fs.existsSync(newPath)) {
        throw new Error('Um item com esse nome já existe');
      }

      fs.renameSync(itemPath, newPath);

      if (this.favorites.has(itemPath)) {
        this.favorites.delete(itemPath);
        this.favorites.add(newPath);
      }

      if (this.folderColors.has(itemPath)) {
        const color = this.folderColors.get(itemPath);
        this.folderColors.delete(itemPath);
        if (color) {
          this.folderColors.set(newPath, color);
        }
      }

      return true;
    } catch (error) {
      console.error('Erro ao renomear item:', error);
      throw error;
    }
  }

  static async moveItem(sourcePath: string, destinationDir: string): Promise<boolean> {
    try {
      if (!this.isPathAllowed(sourcePath) || !this.isPathAllowed(destinationDir)) {
        throw new Error('Acesso negado ao caminho especificado');
      }

      if (!fs.existsSync(sourcePath)) {
        throw new Error('Item de origem não encontrado');
      }

      if (!fs.existsSync(destinationDir)) {
        throw new Error('Diretório de destino não encontrado');
      }

      const fileName = path.basename(sourcePath);
      const newPath = path.join(destinationDir, fileName);

      if (fs.existsSync(newPath)) {
        throw new Error('Um item com esse nome já existe no destino');
      }

      fs.renameSync(sourcePath, newPath);

      if (this.favorites.has(sourcePath)) {
        this.favorites.delete(sourcePath);
        this.favorites.add(newPath);
      }

      if (this.folderColors.has(sourcePath)) {
        const color = this.folderColors.get(sourcePath);
        this.folderColors.delete(sourcePath);
        if (color) {
          this.folderColors.set(newPath, color);
        }
      }

      return true;
    } catch (error) {
      console.error('Erro ao mover item:', error);
      throw error;
    }
  }

  static async copyItem(sourcePath: string, destinationDir: string): Promise<boolean> {
    try {
      if (!this.isPathAllowed(sourcePath) || !this.isPathAllowed(destinationDir)) {
        throw new Error('Acesso negado ao caminho especificado');
      }

      if (!fs.existsSync(sourcePath)) {
        throw new Error('Item de origem não encontrado');
      }

      if (!fs.existsSync(destinationDir)) {
        throw new Error('Diretório de destino não encontrado');
      }

      const fileName = path.basename(sourcePath);
      const newPath = path.join(destinationDir, fileName);

      if (fs.existsSync(newPath)) {
        throw new Error('Um item com esse nome já existe no destino');
      }

      const stat = fs.statSync(sourcePath);

      if (stat.isDirectory()) {
        this.copyDirectoryRecursive(sourcePath, newPath);
      } else {
        fs.copyFileSync(sourcePath, newPath);
      }

      return true;
    } catch (error) {
      console.error('Erro ao copiar item:', error);
      throw error;
    }
  }

  private static copyDirectoryRecursive(src: string, dest: string): void {
    fs.mkdirSync(dest, { recursive: true });
    const files = fs.readdirSync(src);

    for (const file of files) {
      const srcPath = path.join(src, file);
      const destPath = path.join(dest, file);
      const stat = fs.statSync(srcPath);

      if (stat.isDirectory()) {
        this.copyDirectoryRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  static async toggleStar(itemPath: string): Promise<boolean> {
    try {
      if (!this.isPathAllowed(itemPath)) {
        throw new Error('Acesso negado ao item especificado');
      }

      if (!fs.existsSync(itemPath)) {
        throw new Error('Item não encontrado');
      }

      const isCurrentlyStarred = this.favorites.has(itemPath);

      if (isCurrentlyStarred) {
        this.favorites.delete(itemPath);
      } else {
        this.favorites.add(itemPath);
      }

      return !isCurrentlyStarred;
    } catch (error) {
      console.error('Erro ao favoritar item:', error);
      throw error;
    }
  }

  static async setFolderColor(folderPath: string, color: string): Promise<boolean> {
    try {
      if (!this.isPathAllowed(folderPath)) {
        throw new Error('Acesso negado à pasta especificada');
      }

      if (!fs.existsSync(folderPath)) {
        throw new Error('Pasta não encontrada');
      }

      const stat = fs.statSync(folderPath);
      if (!stat.isDirectory()) {
        throw new Error('O caminho especificado não é uma pasta');
      }

      this.folderColors.set(folderPath, color);
      return true;
    } catch (error) {
      console.error('Erro ao definir cor da pasta:', error);
      throw error;
    }
  }

  static getAllStarredItems(): FileSystemItem[] {
    const starredItems: FileSystemItem[] = [];

    for (const itemPath of this.favorites) {
      try {
        if (fs.existsSync(itemPath)) {
          const stat = fs.statSync(itemPath);
          const fileName = path.basename(itemPath);

          const item: FileSystemItem = {
            name: fileName,
            path: itemPath,
            type: stat.isDirectory() ? 'directory' : 'file',
            size: stat.size,
            modified: stat.mtime,
            extension: stat.isFile() ? path.extname(fileName).toLowerCase() : undefined,
            icon: this.getFileIcon(fileName, stat.isDirectory()),
            isStarred: true,
            folderColor: stat.isDirectory() ? this.folderColors.get(itemPath) : undefined,
          };

          starredItems.push(item);
        } else {
          this.favorites.delete(itemPath);
        }
      } catch (error) {
        this.favorites.delete(itemPath);
      }
    }

    return starredItems;
  }

  static async readFile(filePath: string): Promise<string> {
    try {
      if (!this.isPathAllowed(filePath)) {
        throw new Error('Acesso negado ao arquivo especificado');
      }

      if (!fs.existsSync(filePath)) {
        throw new Error('Arquivo não encontrado');
      }

      const stat = fs.statSync(filePath);
      if (!stat.isFile()) {
        throw new Error('O caminho especificado não é um arquivo');
      }

      if (stat.size > 1024 * 1024) {
        throw new Error('Arquivo muito grande para leitura');
      }

      return fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
      console.error('Erro ao ler arquivo:', error);
      throw error;
    }
  }

  static async downloadFile(filePath: string, res: any): Promise<void> {
    try {
      if (!this.isPathAllowed(filePath)) {
        throw new Error('Acesso negado ao arquivo especificado');
      }

      if (!fs.existsSync(filePath)) {
        throw new Error('Arquivo não encontrado');
      }

      const stat = fs.statSync(filePath);
      if (!stat.isFile()) {
        throw new Error('O caminho especificado não é um arquivo');
      }

      const fileName = path.basename(filePath);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Type', 'application/octet-stream');

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Erro ao fazer download:', error);
      throw new Error(error instanceof Error ? error.message : "Erro ao fazer download");
    }
  }

  static async searchFiles(query: string, rootPath: string): Promise<FileSystemItem[]> {
    try {
      const results: FileSystemItem[] = [];
      const searchTerm = query.toLowerCase();

      const searchInDirectory = async (dirPath: string) => {
        try {
          if (!this.isPathAllowed(dirPath)) {
            return;
          }

          const files = fs.readdirSync(dirPath);

          for (const file of files) {
            try {
              const filePath = path.join(dirPath, file);
              const fileStat = fs.statSync(filePath);

              if (file.toLowerCase().includes(searchTerm)) {
                const item: FileSystemItem = {
                  name: file,
                  path: filePath,
                  type: fileStat.isDirectory() ? "directory" : "file",
                  size: fileStat.size,
                  modified: fileStat.mtime,
                  extension: fileStat.isFile() ? path.extname(file).toLowerCase() : undefined,
                  icon: this.getFileIcon(file, fileStat.isDirectory()),
                  isStarred: this.favorites.has(filePath),
                  folderColor: fileStat.isDirectory() ? this.folderColors.get(filePath) : undefined,
                };

                results.push(item);
              }

              if (fileStat.isDirectory() && results.length < 1000) {
                await searchInDirectory(filePath);
              }
            } catch (error: any) {
              continue;
            }
          }
        } catch (error) {
          return;
        }
      };

      await searchInDirectory(rootPath);

      results.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === "directory" ? -1 : 1;
        }
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      });

      return results.slice(0, 500);
    } catch (error) {
      console.error("Erro na busca:", error);
      throw new Error("Erro ao realizar busca");
    }
  }

  private static isPathAllowed(targetPath: string): boolean {
    const allowedPaths = [
      "H:\\",
      "C:\\",
      "C:\\Users",
      "D:\\",
      "E:\\",
      "F:\\",
      "G:\\",
    ];

    const result = allowedPaths.some((allowedPath) => {
      const normalizedAllowed = path.resolve(allowedPath);
      const normalizedPath = path.resolve(targetPath);

      return (
        normalizedPath.startsWith(normalizedAllowed) ||
        normalizedAllowed === normalizedPath
      );
    });

    console.log(`🔐 Verificação de acesso: ${targetPath} -> ${result ? '✅ Permitido' : '❌ Negado'}`);
    return result;
  }

  private static getParentPath(currentPath: string): string | null {
    const parent = path.dirname(currentPath);

    console.log("🔍 Debug getParentPath:");
    console.log("  currentPath:", currentPath);
    console.log("  parent:", parent);

    const normalizedCurrent = path.resolve(currentPath);
    const normalizedParent = path.resolve(parent);

    if (normalizedParent === normalizedCurrent) {
      console.log("  → Retornando null (parent === current)");
      return null;
    }

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
      ".js": "fas fa-file-code",
      ".html": "fas fa-file-code",
      ".css": "fas fa-file-code",
      ".json": "fas fa-file-code",
      ".xml": "fas fa-file-code",
      ".exe": "fas fa-cog",
      ".msi": "fas fa-cog",
    };

    return iconMap[extension] || "fas fa-file";
  }
}