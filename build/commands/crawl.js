"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCrawler = void 0;
const csv_writer_1 = require("csv-writer");
const Queue_1 = require("../helpers/Queue");
const puppeteerInit_1 = require("../helpers/puppeteerInit");
const urlsSet = new Set();
const visitedSet = new Set();
const urlQueue = new Queue_1.Queue();
const EXLUDE_HOSTS = [
    "www.wizinkcenter.es",
    "play.google.com",
    "twitter.com",
    "www.instagram.com",
    "apps.apple.com",
    "www.google.es",
];
const EXCLUDE_TEXT = [".pdf", "linkedin", "mailto:", ".PDF"];
async function crawl(url, csvWriter) {
    if (!url || visitedSet.has(url))
        return;
    await csvWriter.writeRecords([[url]]);
    await (0, puppeteerInit_1.initPuppeteer)(async (page) => {
        try {
            visitedSet.add(url);
            page.on("request", (request) => {
                if (request.url().includes("utag.js")) {
                    request.abort();
                }
                else {
                    request.continue();
                }
            });
            await page.goto(url);
            const links = await page.$$("a");
            for (const link of links) {
                try {
                    const href = await link.getProperty("href");
                    const urlString = await href.jsonValue();
                    if (!urlString ||
                        EXLUDE_HOSTS.includes(new URL(urlString).host) ||
                        EXCLUDE_TEXT.some((substring) => urlString.includes(substring)))
                        continue;
                    if (urlString.includes("wizink") ||
                        urlString.startsWith("/") ||
                        urlString.startsWith(url)) {
                        const generatedURL = new URL(urlString, url).href.split("#")[0];
                        urlsSet.add(generatedURL);
                        if (!visitedSet.has(generatedURL)) {
                            urlQueue.enqueue(generatedURL);
                        }
                    }
                }
                catch (error) {
                    console.log(error);
                }
            }
        }
        catch (err) {
            console.log("Failed to fetch page: ", err);
        }
        finally {
            const nextURL = urlQueue.peek();
            urlQueue.dequeue();
            if (nextURL) {
                await crawl(nextURL, csvWriter);
            }
        }
    });
}
async function startCrawler(BASE_URL, csvPath) {
    const csvWriter = (0, csv_writer_1.createArrayCsvWriter)({
        path: csvPath,
        header: ["URL"],
    });
    await crawl(BASE_URL, csvWriter);
}
exports.startCrawler = startCrawler;
