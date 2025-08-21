-- Criar o banco de dados se não existir
CREATE DATABASE IF NOT EXISTS blockstoragex;
USE blockstoragex;

-- Tabela: settingsSystem
-- Armazena configurações do sistema, como qual disco está sendo usado
CREATE TABLE IF NOT EXISTS settingsSystem (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Inserir configuração padrão do disco
INSERT INTO settingsSystem (setting_key, setting_value, description) 
VALUES ('current_disk', '/app/storage', 'Caminho do disco atualmente em uso')
ON DUPLICATE KEY UPDATE setting_key=setting_key;

-- Tabela: users
-- Armazena informações dos usuários
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username)
);

-- Tabela: favorites
-- Armazena arquivos marcados com estrela
CREATE TABLE IF NOT EXISTS favorites (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    file_path TEXT NOT NULL,
    file_name VARCHAR(255),
    file_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_favorites (user_id),
    UNIQUE KEY unique_user_file (user_id, file_path(255))
);

-- Tabela: logs
-- Registra exclusões de arquivos
CREATE TABLE IF NOT EXISTS logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action_type VARCHAR(50) NOT NULL DEFAULT 'DELETE',
    file_path TEXT NOT NULL,
    file_name VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_action_date (action_type, created_at),
    INDEX idx_user_logs (user_id)
);

-- Tabela: sidebarShortcuts
-- Armazena atalhos personalizados da sidebar
CREATE TABLE IF NOT EXISTS sidebarShortcuts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    shortcut_name VARCHAR(100) NOT NULL,
    shortcut_path TEXT NOT NULL,
    icon VARCHAR(50),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_shortcuts (user_id, is_active)
);