#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const scrap_1 = require("./commands/scrap");
const os_1 = __importDefault(require("os"));
const crawl_1 = require("./commands/crawl");
commander_1.program
    .name("crawcraw")
    .description("CLI to some JavaScript string utilities")
    .version("0.8.0");
commander_1.program
    .command("scrape")
    .argument("<urlsCSVRoute>", "URLs csv route")
    /*  .argument("[configFileRoute]", "Config file route (optional)", "./config.js") */
    .option("--outDir <outDir>", `Output data path (default: ${os_1.default.homedir()}/output.csv)`, `${os_1.default.homedir()}/output.csv`)
    .option("--config <configFileRoute>", "Use a config file", "./config.js")
    .option("--hasElement <hasElement>", "Search if element exists in page")
    .option("--hasRequest <hasRequest>", "Search if request is made on page")
    .description("Scrape a website using Puppeteer")
    .action(async (urlsCSVRoute, options) => {
    const scrap = new scrap_1.Scrap(options);
    await scrap.scrap(urlsCSVRoute);
});
commander_1.program
    .command("crawl")
    .argument("<base_url>", "URL to start crawling")
    .option("--outDir <outDir>", `Output data path (default: ${os_1.default.homedir()}/crawler_urls.csv)`, `${os_1.default.homedir()}/crawler_urls.csv`)
    .description("Crawl a website using Puppeteer")
    .action(async (base_url, options) => {
    await (0, crawl_1.startCrawler)(base_url, options.outDir).catch((error) => console.error("Error:", error));
});
commander_1.program
    .command("test")
    .option("--test <arg1>")
    .action((options) => {
    console.log();
});
commander_1.program.parse(process.argv);
