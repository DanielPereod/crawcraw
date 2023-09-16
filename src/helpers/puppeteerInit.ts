import puppeteer, { Page } from "puppeteer";

export async function initPuppeteer(callback: (page: Page) => Promise<void>) {
  const browser = await puppeteer.launch({
    headless: "new",
  });
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  await page.setCacheEnabled(false);
  await callback(page)
  await browser.close();
}
