import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import path from 'node:path'

/**
 * O `main.tsx` importa o MSW dinamicamente (só no modo com mocks) e espera o worker antes do primeiro render.
 * Sem dica no HTML, o chunk do mock só começa a baixar depois que o bundle principal executa. O `modulepreload`
 * baixa os dois em paralelo; a ordem de execução continua a mesma (o mock segue antes do render).
 */
function preloadMocks(): Plugin {
  return {
    name: 'kurio:preload-mocks',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, { bundle }) {
        if (!bundle) return
        const entry = Object.values(bundle).find(
          (chunk) => chunk.type === 'chunk' && chunk.isDynamicEntry && chunk.facadeModuleId?.endsWith('/mocks/browser.ts'),
        )
        if (!entry || entry.type !== 'chunk') return
        const files = [entry.fileName, ...entry.imports].filter((file) => !html.includes(`/${file}"`))
        return files.map((file) => ({ tag: 'link', attrs: { rel: 'modulepreload', crossorigin: true, href: `/${file}` }, injectTo: 'head' as const }))
      },
    },
  }
}

export default defineConfig({
  plugins: [
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    preloadMocks(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      // O MSW leva `tough-cookie`, que só usa `getDomain` do `tldts`. A variante `experimental` tem a mesma API e a
      // mesma lista de sufixos públicos, em formato compacto: o chunk do mock cai de ~475 KB para menos da metade.
      tldts: 'tldts-experimental',
    },
  },
})
