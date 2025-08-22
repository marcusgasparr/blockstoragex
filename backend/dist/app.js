"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const diskRoutes_1 = __importDefault(require("./routes/diskRoutes"));
const fileSystemRoutes_1 = __importDefault(require("./routes/fileSystemRoutes"));
const settingsRoutes_1 = __importDefault(require("./routes/settingsRoutes"));
const favoritesRoutes_1 = __importDefault(require("./routes/favoritesRoutes"));
const sidebarShortcutsRoutes_1 = __importDefault(require("./routes/sidebarShortcutsRoutes"));
const logsRoutes_1 = __importDefault(require("./routes/logsRoutes"));
const app = (0, express_1.default)();
// Middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Rotas
app.use('/api/disk', diskRoutes_1.default);
app.use('/api/files', fileSystemRoutes_1.default);
app.use('/api/settings', settingsRoutes_1.default);
app.use('/api/favorites-db', favoritesRoutes_1.default);
app.use('/api/sidebar-shortcuts', sidebarShortcutsRoutes_1.default);
app.use('/api/logs', logsRoutes_1.default);
// Rota de teste
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'BlockStorageX API funcionando',
        timestamp: new Date().toISOString()
    });
});
// Middleware de erro
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
    });
});
exports.default = app;
