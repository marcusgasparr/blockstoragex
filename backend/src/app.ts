import express from 'express';
import cors from 'cors';
import diskRoutes from './routes/diskRoutes';
import fileSystemRoutes from './routes/fileSystemRoutes';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/disk', diskRoutes);
app.use('/api/files', fileSystemRoutes);

// Rota de teste
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'BlockStorageX API funcionando',
    timestamp: new Date().toISOString()
  });
});

// Middleware de erro
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor'
  });
});

export default app;
