"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scrap = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const csv_writer_1 = require("csv-writer");
const csvHelpers_1 = require("../helpers/csvHelpers");
const configHelper_1 = require("../helpers/configHelper");
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const helpers_1 = require("../helpers/helpers");
class Scrap {
    constructor(options) {
        this.scrapedData = [];
        this.spinner = (0, ora_1.default)("Starting to scrap");
        this.options = options;
    }
    async initPuppeteer() {
        this.browser = await puppeteer_1.default.launch({
            headless: "new",
        });
        this.page = await this.browser.newPage();
        await this.page.setRequestInterception(true);
        await this.page.setCacheEnabled(false);
    }
    async scrapWithConfig(config, url) {
        const scriptsNames = Object.keys(config.scripts);
        for (let i = 0; i < scriptsNames.length; i++) {
            const script = config.scripts[scriptsNames[i]];
            const result = await script(this.page, scriptsNames[i]);
            (0, helpers_1.updateSpinnerResult)(this.spinner, result);
            this.scrapedData.push([url, result.checkName, result.result, result.data]);
        }
    }
    async scrapFor(type, url) {
        const elementArray = (0, helpers_1.stringToArray)(this.options.hasElement);
        for (let i = 0; i < elementArray.length; i++) {
            const elementToFind = elementArray[i];
            if (type === "selector") {
                try {
                    await this.page.waitForSelector(elementToFind, { timeout: 3000 });
                    this.scrapedData.push([url, elementToFind, "OK"]);
                    this.spinner.text += ` | ${chalk_1.default.blue.bold(elementToFind)}: ${chalk_1.default.green.bold("OK")}`;
                }
                catch (error) {
                    this.scrapedData.push([url, elementToFind, "KO"]);
                    this.spinner.text += ` | ${chalk_1.default.blue.bold(elementToFind)}: ${chalk_1.default.red.bold("KO")}`;
                }
            }
            else if (type === "function") {
                const hasFunction = await this.page.waitForFunction(elementToFind);
                const result = hasFunction ? "OK" : "KO";
                this.scrapedData.push([url, elementToFind, result]);
                (0, helpers_1.updateSpinnerResult)(this.spinner, {
                    checkName: elementToFind,
                    result,
                });
            }
        }
    }
    async scrap(urlsCSVRoute) {
        await this.initPuppeteer();
        const urls = await (0, csvHelpers_1.readCsvFile)(urlsCSVRoute);
        this.page.on("request", (request) => {
            request.continue();
        });
        this.page.on("response", (response) => { });
        this.spinner.spinner = "pipe";
        for (let i = 0; i < urls.length; i++) {
            try {
                const url = urls[i];
                this.spinner.start();
                this.spinner.spinner = "dots4";
                this.spinner.text = `${chalk_1.default.bgMagenta.bold(` ${"Navigating"} `)} ${url}`;
                await this.page.goto(url, {
                    waitUntil: "networkidle0",
                });
                if (this.options.configFileRoute) {
                    const config = await (0, configHelper_1.loadConfig)(this.options.configFileRoute);
                    await this.scrapWithConfig(config, url);
                }
                if (this.options.hasElement) {
                    await this.scrapFor("selector", url);
                }
                this.spinner.succeed();
            }
            catch (error) {
                this.spinner.fail();
            }
            finally {
                this.spinner.stop();
            }
        }
        if (this.options.outDir) {
            const csvWriter = (0, csv_writer_1.createArrayCsvWriter)({
                path: this.options.outDir,
                header: ["URL", "CheckName", "Result"],
            });
            await csvWriter.writeRecords(this.scrapedData);
        }
        this.browser.close();
    }
}
exports.Scrap = Scrap;
