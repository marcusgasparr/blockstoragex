"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = require("../db");
class User {
    static async findByUsername(username) {
        return await (0, db_1.getOne)('SELECT * FROM users WHERE username = ?', [username]);
    }
    static async findById(id) {
        return await (0, db_1.getOne)('SELECT * FROM users WHERE id = ?', [id]);
    }
    static async create(userData) {
        const hashedPassword = await bcrypt_1.default.hash(userData.password, 10);
        const userId = await (0, db_1.insert)('users', {
            username: userData.username,
            password_hash: hashedPassword,
            email: userData.email || null
        });
        return userId;
    }
    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt_1.default.compare(plainPassword, hashedPassword);
    }
    static async updatePassword(userId, newPassword) {
        const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
        // Como não temos função update exportada, vamos usar query diretamente
        return await (0, db_1.query)('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, userId]);
    }
}
exports.User = User;
