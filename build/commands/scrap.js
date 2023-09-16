"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scrapper = void 0;
const chalk_1 = __importDefault(require("chalk"));
const csv_writer_1 = require("csv-writer");
const ora_1 = __importDefault(require("ora"));
const path_1 = __importDefault(require("path"));
const puppeteer_1 = __importDefault(require("puppeteer"));
const Queue_1 = require("../helpers/Queue");
const csvHelpers_1 = require("../helpers/csvHelpers");
const helpers_1 = require("../helpers/helpers");
class Scrapper {
    constructor(options) {
        this.scrapedData = [];
        this.urlsSet = new Set();
        this.visitedSet = new Set();
        this.urlQueue = new Queue_1.Queue();
        this.capturedRequests = [];
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
        this.page.on("request", (request) => {
            var _a, _b, _c;
            if (this.capturedRequests.length <= 0) {
                const foundInterceptedRequest = (_a = this.config) === null || _a === void 0 ? void 0 : _a.interceptedRequests.find((item) => {
                    return this.capturedRequests.some((url) => new RegExp(item.url).test(url));
                });
                if (foundInterceptedRequest) {
                    this.scrapedData.push([this.page.url(), foundInterceptedRequest.name, "OK"]);
                    this.spinner.start(`${this.page.url(), foundInterceptedRequest.name, "OK"}`);
                }
                this.capturedRequests = [];
            }
            this.capturedRequests.push(request.url());
            if ((_c = (_b = this.config) === null || _b === void 0 ? void 0 : _b.block_request) === null || _c === void 0 ? void 0 : _c.includes(request.url())) {
                request.abort();
            }
            else {
                request.continue();
            }
        });
        this.page.on("response", (request) => { });
    }
    async loadConfig(configPath) {
        if (!configPath)
            return;
        try {
            this.spinner.text = `Loading configuration from ${configPath}`;
            const isAbsolutePath = path_1.default.isAbsolute(configPath);
            const absolutePath = isAbsolutePath
                ? configPath
                : path_1.default.resolve(__dirname, "../", configPath);
            const configModule = await Promise.resolve(`${absolutePath}`).then(s => __importStar(require(s)));
            this.config = configModule.default;
            this.spinner.succeed("Configuration file loaded");
        }
        catch (error) {
            this.spinner.fail(`Error loading configuration: ${error}`);
        }
    }
    async scrapWithConfig(url) {
        var _a;
        if (!this.config)
            return;
        const scriptsNames = Object.keys(this.config.scripts);
        for (let i = 0; i < scriptsNames.length; i++) {
            const script = this.config.scripts[scriptsNames[i]];
            const result = await script(this.page, scriptsNames[i]);
            this.spinner.text += ` | ${chalk_1.default.blue.bold(result.checkName)}:${chalk_1.default[result.result ? "green" : "red"].bold(result.result)}`;
            this.scrapedData.push([url, result.checkName, result.result, result.data]);
            (_a = this.csvWriter) === null || _a === void 0 ? void 0 : _a.writeRecords([[url, result.checkName, result.result, result.data]]);
        }
    }
    async scrapFor(type, url) {
        var _a, _b;
        const elementArray = (0, helpers_1.stringToArray)(this.options.hasElement);
        for (let i = 0; i < elementArray.length; i++) {
            const elementToFind = elementArray[i];
            try {
                if (type === "function") {
                    await this.page.waitForFunction(elementToFind);
                }
                else if (type === "selector") {
                    await this.page.waitForSelector(elementToFind);
                }
                this.scrapedData.push([url, elementToFind, "OK"]);
                (_a = this.csvWriter) === null || _a === void 0 ? void 0 : _a.writeRecords([[url, elementToFind, "OK"]]);
                this.spinner.text += ` | ${chalk_1.default.blue.bold(elementToFind)}:${chalk_1.default.green.bold("OK")}`;
            }
            catch (error) {
                this.scrapedData.push([url, elementToFind, "KO"]);
                (_b = this.csvWriter) === null || _b === void 0 ? void 0 : _b.writeRecords([[url, elementToFind, "KO"]]);
                this.spinner.text += ` | ${chalk_1.default.blue.bold(elementToFind)}:${chalk_1.default.red.bold("KO")}`;
            }
        }
    }
    async navigate(urlsCSVRoute) {
        const urls = await (0, csvHelpers_1.readCsvFile)(urlsCSVRoute);
        for (let i = 0; i < urls.length; i++) {
            try {
                const url = urls[i];
                this.spinner.start();
                this.spinner.spinner = "dots4";
                this.spinner.text = `${chalk_1.default.bgMagenta.bold(` ${"Navigating"} `)} ${url}`;
                await this.page.goto(url, {
                    waitUntil: "networkidle0",
                });
                await new Promise((r) => setTimeout(r, 3000));
                if (this.options.config) {
                    await this.scrapWithConfig(url);
                }
                if (this.options.hasElement) {
                    await this.scrapFor("selector", url);
                }
                if (this.options.hasFunction) {
                    await this.scrapFor("function", url);
                }
                this.spinner.succeed();
            }
            catch (error) {
                this.spinner.fail(`${chalk_1.default.bgRed.bold(` ${"Navigating"} `)} ${this.page.url()}: ${error.message}`);
            }
            finally {
                this.spinner.stop();
            }
        }
        this.browser.close();
    }
    async crawl(url) {
        var _a, _b, _c, _d;
        if (!url || this.visitedSet.has(url))
            return;
        this.spinner.text = `${chalk_1.default.bgMagenta.bold(` ${"Navigating"} `)} ${url}`;
        try {
            this.visitedSet.add(url);
            await this.page.goto(url);
            if (this.options.config) {
                await this.scrapWithConfig(url);
            }
            if (this.options.hasElement) {
                await this.scrapFor("selector", url);
            }
            if (this.options.hasFunction) {
                await this.scrapFor("function", url);
            }
            this.spinner.succeed();
            const links = await this.page.$$("a");
            for (let i = 0; i < links.length; i++) {
                const link = links[i];
                try {
                    const href = await link.getProperty("href");
                    const urlString = await href.jsonValue();
                    if (!urlString ||
                        ((_b = (_a = this.config) === null || _a === void 0 ? void 0 : _a.exclude_hosts) === null || _b === void 0 ? void 0 : _b.includes(new URL(urlString).host)) ||
                        ((_d = (_c = this.config) === null || _c === void 0 ? void 0 : _c.exclude_text) === null || _d === void 0 ? void 0 : _d.some((substring) => urlString.includes(substring))))
                        continue;
                    if (
                    //TODO: FIX THIS
                    urlString.includes("wizink") ||
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
                    this.spinner.fail(`${chalk_1.default.bgRed.bold(` ${"Navigating"} `)} ${this.page.url()}: ${error.message}`);
                }
            }
        }
        catch (error) {
            this.spinner.fail(`${chalk_1.default.bgRed.bold(` ${"Navigating"} `)} ${this.page.url()}: ${error.message}`);
        }
        finally {
            const nextURL = this.urlQueue.peek();
            this.urlQueue.dequeue();
            if (nextURL) {
                await this.crawl(nextURL);
            }
            this.browser.close();
        }
    }
    async start(data, type) {
        await this.loadConfig(this.options.config);
        await this.initPuppeteer();
        this.spinner.start("Starting");
        this.spinner.spinner = "pipe";
        this.csvWriter = (0, csv_writer_1.createArrayCsvWriter)({
            path: this.options.outDir,
        });
        if (type === "default") {
            await this.navigate(data);
        }
        else if (type === "crawler") {
            try {
                await this.crawl(data);
                this.spinner.succeed(`URLs stored in ${this.options.outDir}`);
            }
            catch (error) {
                this.spinner.fail(`${chalk_1.default.bgRed.bold(` ${"Navigating"} `)} ${this.page.url()}: ${error.message}`);
            }
        }
    }
}
exports.Scrapper = Scrapper;
