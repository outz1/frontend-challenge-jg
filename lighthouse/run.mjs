// Auditoria Lighthouse (§10): início e detalhe, mobile e desktop, 3 medições, mediana por categoria.
// Pré-requisito: `npm run build` (build de demonstração com mocks). Relatórios em lighthouse/reports/.
// Variáveis: LH_RUNS (1 a 3), LH_TARGETS (nomes separados por vírgula), LH_BASE_URL (usa um servidor já no ar).
import desktopConfig from 'lighthouse/core/config/desktop-config.js'
import { execFileSync, spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { cpus, loadavg, release, totalmem } from 'node:os'
import { fileURLToPath } from 'node:url'
import lighthouse from 'lighthouse'
import { chromium } from '@playwright/test'

const port = 4174
const debugPort = 9333
const baseUrl = process.env.LH_BASE_URL ?? `http://127.0.0.1:${port}`
const outputDir = new URL('./reports/', import.meta.url)
const repeats = Math.max(1, Math.min(3, Number(process.env.LH_RUNS ?? 3)))
const categories = ['performance', 'accessibility', 'best-practices', 'seo']
const detailPath = '/nft/nft-001'
const targets = [
  { name: 'home-desktop', path: '/', formFactor: 'desktop' },
  { name: 'detail-desktop', path: detailPath, formFactor: 'desktop' },
  { name: 'home-mobile', path: '/', formFactor: 'mobile' },
  { name: 'detail-mobile', path: detailPath, formFactor: 'mobile' },
]
const thresholds = { performance: 90, accessibility: 95, 'best-practices': 95, seo: 90 }

const emulation = (formFactor) =>
  formFactor === 'mobile'
    ? { mobile: true, width: 390, height: 844, deviceScaleFactor: 1, disabled: false }
    : { mobile: false, width: 1440, height: 1000, deviceScaleFactor: 1, disabled: false }

const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]
const score = (lhr, key) => Math.round((lhr.categories[key]?.score ?? 0) * 100)

async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      if ((await fetch(baseUrl)).ok) return
    } catch {
      // O preview ainda está iniciando.
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error('O preview não respondeu a tempo. Rode `npm run build` antes.')
}

if (!process.env.LH_BASE_URL && !existsSync(new URL('../dist/index.html', import.meta.url))) {
  throw new Error('dist/ não existe. Rode `npm run build` antes da auditoria.')
}

let sourceCommit = process.env.VERCEL_GIT_COMMIT_SHA
try {
  sourceCommit ??= execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
} catch {
  // Código exportado pode não ter histórico Git.
}

// Carga do sistema antes e depois: a limitação de CPU do Lighthouse amplifica ruído de outros programas.
const loadBefore = loadavg()
await mkdir(outputDir, { recursive: true })
const preview = process.env.LH_BASE_URL
  ? undefined
  : spawn(
      process.execPath,
      [fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url)), 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
      { stdio: 'inherit' },
    )

// Chromium do Playwright com porta de depuração: evita depender de chrome-launcher.
const browser = await chromium.launch({ args: [`--remote-debugging-port=${debugPort}`] })
try {
  await waitForServer()
  const summary = []
  const selected = targets.filter((t) => !process.env.LH_TARGETS || process.env.LH_TARGETS.split(',').includes(t.name))
  for (const target of selected) {
    const runs = []
    for (let run = 1; run <= repeats; run += 1) {
      const isDesktop = target.formFactor === 'desktop'
      const result = await lighthouse(
        `${baseUrl}${target.path}`,
        { port: debugPort, output: ['json', 'html'], logLevel: 'error' },
        {
          ...(isDesktop ? desktopConfig : { extends: 'lighthouse:default' }),
          settings: {
            ...(isDesktop ? desktopConfig.settings : {}),
            onlyCategories: categories,
            formFactor: target.formFactor,
            screenEmulation: emulation(target.formFactor),
            throttlingMethod: 'simulate',
            locale: 'pt-BR',
          },
        },
      )
      if (!result) throw new Error(`Lighthouse não retornou resultado para ${target.name}.`)
      await writeFile(new URL(`${target.name}-run-${run}.json`, outputDir), JSON.stringify(result.lhr, null, 2))
      await writeFile(new URL(`${target.name}-run-${run}.html`, outputDir), Array.isArray(result.report) ? result.report[1] : result.report)
      runs.push({
        performance: score(result.lhr, 'performance'),
        accessibility: score(result.lhr, 'accessibility'),
        'best-practices': score(result.lhr, 'best-practices'),
        seo: score(result.lhr, 'seo'),
        lcpMs: Math.round(result.lhr.audits['largest-contentful-paint']?.numericValue ?? 0),
        cls: Number((result.lhr.audits['cumulative-layout-shift']?.numericValue ?? 0).toFixed(4)),
        tbtMs: Math.round(result.lhr.audits['total-blocking-time']?.numericValue ?? 0),
      })
    }
    const medians = Object.fromEntries(Object.keys(runs[0]).map((key) => [key, median(runs.map((r) => r[key]))]))
    const meetsTargets = Object.entries(thresholds).every(([key, value]) => medians[key] >= value)
    summary.push({ ...target, runs, medians, meetsTargets })
  }

  const lighthouseVersion = JSON.parse(readFileSync(new URL('../node_modules/lighthouse/package.json', import.meta.url), 'utf8')).version
  await writeFile(
    new URL('lighthouse-summary.json', outputDir),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        baseUrl,
        sourceCommit,
        environment: {
          node: process.version,
          platform: process.platform,
          osRelease: release(),
          architecture: process.arch,
          cpu: cpus()[0]?.model,
          memoryGiB: Math.round(totalmem() / 1024 ** 3),
          chromium: browser.version(),
          lighthouse: lighthouseVersion,
          loadAverageBefore: loadBefore.map((v) => Number(v.toFixed(2))),
          loadAverageAfter: loadavg().map((v) => Number(v.toFixed(2))),
        },
        thresholds,
        targets: summary,
      },
      null,
      2,
    ),
  )
  if (summary.some((r) => !r.meetsTargets)) process.exitCode = 1
  console.log(JSON.stringify(summary.map(({ name, medians, meetsTargets }) => ({ name, medians, meetsTargets })), null, 2))
} finally {
  await browser.close()
  preview?.kill('SIGTERM')
}
