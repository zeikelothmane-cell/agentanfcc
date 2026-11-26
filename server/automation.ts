import type { Browser, BrowserContext, Page } from 'playwright'

export type AutomationMode = 'simulation' | 'configured'

export interface AutomationAdapter {
  mode: AutomationMode
  start(demandId: string): Promise<void>
  resume(demandId: string, humanAction: 'sms' | 'payment'): Promise<void>
  close(): Promise<void>
}

export function createAutomationAdapter(modeValue: string): AutomationAdapter {
  if (modeValue !== 'configured') {
    return {
      mode: 'simulation',
      async start(demandId) {
        await new Promise((resolve) => setTimeout(resolve, 600))
        console.log(`[simulation] Parcours démarré pour ${demandId}`)
      },
      async resume(demandId) {
        console.log(`[simulation] Reprise pour ${demandId}`)
      },
      async close() {}
    }
  }

  let browser: Browser | undefined
  let context: BrowserContext | undefined
  let page: Page | undefined

  return {
    mode: 'configured',
    async start(demandId) {
      if (!process.env.ANCFCC_PORTAL_URL) {
        throw new Error('ANCFCC_PORTAL_URL non configurée. Aucun navigateur ne sera lancé.')
      }
      const { chromium } = await import('playwright')
      browser = await chromium.launch({ headless: process.env.ANCFCC_HEADLESS !== 'false' })
      context = await browser.newContext()
      page = await context.newPage()
      await page.goto(process.env.ANCFCC_PORTAL_URL, { waitUntil: 'domcontentloaded' })
      console.warn(`[adaptateur] Parcours réel à configurer avec les sélecteurs observés pour ${demandId}`)
    },
    async resume(demandId, humanAction) {
      console.log(`[adaptateur] Reprise ${humanAction} pour ${demandId}; page=${Boolean(page)} context=${Boolean(context)}`)
    },
    async close() {
      await context?.close()
      await browser?.close()
    }
  }
}
