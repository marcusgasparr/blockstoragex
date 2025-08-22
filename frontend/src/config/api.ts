// ==============================================
// CONFIGURAÇÃO DINÂMICA DA API
// ==============================================
// Este arquivo detecta automaticamente o ambiente
// e configura a URL base da API corretamente

interface ApiConfig {
  baseURL: string;
  timeout: number;
  retries: number;
}

// Detectar ambiente e configurar URL da API
function getApiBaseURL(): string {
  // 1. Primeiro tenta pegar da variável de ambiente do Vite
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl !== 'undefined') {
    console.log('🌍 Usando URL da API do .env:', envUrl);
    return envUrl;
  }

  // 2. Se não tiver, detecta automaticamente baseado no hostname
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // Para Docker Compose, usar o hostname atual mas porta 3001
  const apiUrl = `${protocol}//${hostname}:3001`;
  
  console.log('🔍 URL da API detectada automaticamente:', apiUrl);
  return apiUrl;
}

// Configuração da API
export const apiConfig: ApiConfig = {
  baseURL: getApiBaseURL(),
  timeout: 10000, // 10 segundos
  retries: 3
};

// URL completa da API
export const API_BASE_URL = `${apiConfig.baseURL}/api`;

// Log da configuração atual
console.log('⚙️ Configuração da API:', {
  baseURL: apiConfig.baseURL,
  fullApiUrl: API_BASE_URL,
  environment: import.meta.env.MODE || 'production'
});