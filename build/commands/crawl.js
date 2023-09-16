"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Crawler = void 0;
const csv_writer_1 = require("csv-writer");
const Queue_1 = require("../helpers/Queue");
const puppeteer_1 = __importDefault(require("puppeteer"));
const ora_1 = __importDefault(require("ora"));
const chalk_1 = __importDefault(require("chalk"));
const EXLUDE_HOSTS = [
    "www.wizinkcenter.es",
    "play.google.com",
    "twitter.com",
    "www.instagram.com",
    "apps.apple.com",
    "www.google.es",
];
const EXCLUDE_TEXT = [".pdf", "linkedin", "mailto:", ".PDF"];
class Crawler {
    constructor(options) {
        this.urlsSet = new Set();
        this.visitedSet = new Set();
        this.urlQueue = new Queue_1.Queue();
        this.spinner = (0, ora_1.default)("Starting to scrap");
        this.options = options;
    }
    async initPuppeteer() {
        this.browser = await puppeteer_1.default.launch({
            headless: "new",
        });
        this.page = await this.browser.newPage();
        this.page.setDefaultNavigationTimeout(this.options.timoutMiliseconds || 2000);
        await this.page.setRequestInterception(true);
        await this.page.setCacheEnabled(false);
    }
    async crawl(url, csvWriter) {
        if (!url || this.visitedSet.has(url))
            return;
        this.spinner.text = `${chalk_1.default.bgMagenta.bold(` ${"Navigating"} `)} ${url}`;
        await csvWriter.writeRecords([[url]]);
        try {
            this.visitedSet.add(url);
            this.page.on("request", (request) => {
                if (request.url().includes("utag.js")) {
                    request.abort();
                }
                else {
                    request.continue();
                }
            });
            await this.page.goto(url);
            const links = await this.page.$$("a");
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
                        this.urlsSet.add(generatedURL);
                        if (!this.visitedSet.has(generatedURL)) {
                            this.urlQueue.enqueue(generatedURL);
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
            const nextURL = this.urlQueue.peek();
            this.urlQueue.dequeue();
            if (nextURL) {
                await this.crawl(nextURL, csvWriter);
            }
            this.browser.close();
        }
    }
    async start(BASE_URL) {
        this.spinner.start("Starting crawler");
        await this.initPuppeteer();
        const csvWriter = (0, csv_writer_1.createArrayCsvWriter)({
            path: this.options.outDir,
            header: ["URL"],
        });
        try {
            await this.crawl(BASE_URL, csvWriter);
            this.spinner.succeed(`URLs stored in ${this.options.outDir}`);
        }
        catch (error) {
            this.spinner.fail();
        }
    }
}
exports.Crawler = Crawler;
