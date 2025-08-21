import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import path from 'path';

// Carregar .env do diretório backend
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function initDatabase() {
  console.log('🔧 Initializing database...');
  
  let connection: mysql.Connection | null = null;
  
  try {
    // Criar conexão direta
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '123456',
      database: process.env.DB_NAME || 'blockstoragex'
    });
    
    console.log('✅ Connected to database');
    
    // Criar usuário admin
    const adminPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    await connection.execute(
      `INSERT INTO users (username, password_hash, email) 
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE username=username`,
      ['admin', hashedPassword, 'admin@example.com']
    );
    
    console.log('✅ Database initialized successfully!');
    console.log('📝 Default admin user created:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   ⚠️  Please change the password after first login!');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.log('\n📌 Certifique-se que:');
    console.log('1. MySQL está rodando');
    console.log('2. O banco "file_manager" existe');
    console.log('3. As credenciais no .env estão corretas');
    console.log('\nDetalhes do erro:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
    process.exit();
  }
}

// Executar
initDatabase();