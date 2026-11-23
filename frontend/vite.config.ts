import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function isInvalidProductionApiUrl(url: string | undefined) {
  const value = url?.trim() ?? ''
  return (
    !value ||
    value.startsWith('/') ||
    /localhost|s3-website|cloudfront\.net|s3\.amazonaws\.com/i.test(value)
  )
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl = env.VITE_API_URL || process.env.VITE_API_URL

  if (mode === 'production' && isInvalidProductionApiUrl(apiUrl)) {
    throw new Error(
      'VITE_API_URL deve ser a URL pública da API na EC2 (ex: http://54.x.x.x/api). Não use a URL do S3 nem um caminho relativo /api.'
    )
  }

  return {
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: 'http://localhost:5001',
          changeOrigin: true,
        },
      },
    },
  }
})
