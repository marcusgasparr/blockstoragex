import app from './app';

const PORT = process.env.PORT || 5879;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 API de disco disponível em: http://localhost:${PORT}/api/disk/info`);
});
