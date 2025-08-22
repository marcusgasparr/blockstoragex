"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Favorite_1 = require("../lib/models/Favorite");
const router = express_1.default.Router();
router.post('/toggle', async (req, res) => {
    const { userId, filePath, fileName, fileType } = req.body;
    try {
        const isFav = await Favorite_1.Favorite.isFavorite(userId, filePath);
        if (isFav) {
            await Favorite_1.Favorite.remove(userId, filePath);
            res.json({ success: true, action: 'removed' });
        }
        else {
            await Favorite_1.Favorite.add(userId, filePath, fileName, fileType);
            res.json({ success: true, action: 'added' });
        }
    }
    catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        res.status(500).json({ success: false, message: errMsg });
    }
});
exports.default = router;
// GET /api/favorites-db/user/:userId
router.get('/user/:userId', async (req, res) => {
    const userId = Number(req.params.userId);
    try {
        const favorites = await Favorite_1.Favorite.getUserFavorites(userId);
        res.json({ success: true, data: favorites });
    }
    catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        res.status(500).json({ success: false, message: errMsg });
    }
});
// GET /api/favorites-db/stats/:userId
router.get('/stats/:userId', async (req, res) => {
    const userId = Number(req.params.userId);
    try {
        // Implemente Favorite.getStats(userId) conforme sua lógica
        if (typeof Favorite_1.Favorite.getStats === 'function') {
            const stats = await Favorite_1.Favorite.getStats(userId);
            res.json({ success: true, data: stats });
        }
        else {
            res.json({ success: true, data: {} }); // Retorno vazio se não implementado
        }
    }
    catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        res.status(500).json({ success: false, message: errMsg });
    }
});
