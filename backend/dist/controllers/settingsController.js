"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsController = void 0;
const db_1 = require("../lib/db");
class SettingsController {
    // GET /api/settings/current-disk - Obter disco atual
    static async getCurrentDisk(req, res) {
        try {
            console.log('🔍 Buscando disco atual do sistema...');
            const setting = await (0, db_1.getOne)('SELECT setting_value FROM settingsSystem WHERE setting_key = ?', ['current_disk']);
            if (!setting) {
                // Se não existir, criar com valor padrão
                console.log('⚠️ Configuração de disco não encontrada, criando padrão...');
                const defaultDisk = process.platform === 'win32' ? 'C:\\' : '/';
                await (0, db_1.query)('INSERT INTO settingsSystem (setting_key, setting_value, description) VALUES (?, ?, ?)', ['current_disk', defaultDisk, 'Caminho do disco atualmente em uso']);
                return res.json({
                    success: true,
                    data: {
                        current_disk: defaultDisk
                    },
                    message: 'Configuração padrão criada'
                });
            }
            console.log('✅ Disco atual encontrado:', setting.setting_value);
            res.json({
                success: true,
                data: {
                    current_disk: setting.setting_value
                }
            });
        }
        catch (error) {
            console.error('❌ Erro ao buscar disco atual:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao buscar configuração do disco',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            });
        }
    }
    // PUT /api/settings/current-disk - Atualizar disco atual
    static async updateCurrentDisk(req, res) {
        try {
            const { diskPath } = req.body;
            if (!diskPath) {
                return res.status(400).json({
                    success: false,
                    message: 'Caminho do disco é obrigatório'
                });
            }
            console.log('💾 Atualizando disco atual para:', diskPath);
            // Verificar se já existe a configuração
            const existingSetting = await (0, db_1.getOne)('SELECT id FROM settingsSystem WHERE setting_key = ?', ['current_disk']);
            if (existingSetting) {
                // Atualizar configuração existente
                await (0, db_1.query)('UPDATE settingsSystem SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?', [diskPath, 'current_disk']);
            }
            else {
                // Criar nova configuração
                await (0, db_1.query)('INSERT INTO settingsSystem (setting_key, setting_value, description) VALUES (?, ?, ?)', ['current_disk', diskPath, 'Caminho do disco atualmente em uso']);
            }
            console.log('✅ Disco atualizado com sucesso');
            res.json({
                success: true,
                data: {
                    current_disk: diskPath
                },
                message: 'Disco atualizado com sucesso'
            });
        }
        catch (error) {
            console.error('❌ Erro ao atualizar disco:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao atualizar configuração do disco',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            });
        }
    }
    // GET /api/settings/all - Obter todas as configurações
    static async getAllSettings(req, res) {
        try {
            console.log('🔍 Buscando todas as configurações...');
            const settings = await (0, db_1.query)('SELECT setting_key, setting_value, description, updated_at FROM settingsSystem ORDER BY setting_key');
            // Converter array para objeto
            const settingsObject = {};
            settings.forEach(setting => {
                settingsObject[setting.setting_key] = {
                    value: setting.setting_value,
                    description: setting.description,
                    updated_at: setting.updated_at
                };
            });
            console.log('✅ Configurações encontradas:', Object.keys(settingsObject).length);
            res.json({
                success: true,
                data: settingsObject,
                count: settings.length
            });
        }
        catch (error) {
            console.error('❌ Erro ao buscar configurações:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao buscar configurações',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            });
        }
    }
    // PUT /api/settings/bulk - Atualizar múltiplas configurações
    static async updateSettings(req, res) {
        try {
            const { settings } = req.body;
            if (!settings || typeof settings !== 'object') {
                return res.status(400).json({
                    success: false,
                    message: 'Configurações devem ser um objeto'
                });
            }
            console.log('💾 Atualizando configurações em lote...');
            const promises = Object.entries(settings).map(async ([key, value]) => {
                const existingSetting = await (0, db_1.getOne)('SELECT id FROM settingsSystem WHERE setting_key = ?', [key]);
                if (existingSetting) {
                    return (0, db_1.query)('UPDATE settingsSystem SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?', [value, key]);
                }
                else {
                    return (0, db_1.query)('INSERT INTO settingsSystem (setting_key, setting_value, description) VALUES (?, ?, ?)', [key, value, `Configuração para ${key}`]);
                }
            });
            await Promise.all(promises);
            console.log('✅ Configurações atualizadas com sucesso');
            res.json({
                success: true,
                message: 'Configurações atualizadas com sucesso',
                count: Object.keys(settings).length
            });
        }
        catch (error) {
            console.error('❌ Erro ao atualizar configurações:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao atualizar configurações',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            });
        }
    }
}
exports.SettingsController = SettingsController;
