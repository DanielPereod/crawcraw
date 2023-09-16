#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const scrap_1 = require("./commands/scrap");
const os_1 = __importDefault(require("os"));
commander_1.program
    .name("crawcraw")
    .description("CLI to some JavaScript string utilities")
    .version("0.8.0");
commander_1.program
    .command("scrape")
    .argument("<baseURLs>", "URLs csv route or starting URL if crawling")
    .option("-od, --outDir <outDir>", `Output data path (default: ${os_1.default.homedir()}/output.csv)`, `${os_1.default.homedir()}/output.csv`)
    .option("-c, --config <configFileRoute>", "Use a config file")
    .option("-he, --hasElement <hasElement>", "Search if element exists in page")
    .option("-hr, --hasRequest <hasRequest>", "Search if request is made on page")
    .option("-to, --timeout <timoutMiliseconds>", "Set the default timeout for puppeteer in miliseconds (default: 2000)")
    .option("-cw, --crawl", "URL to start crawling")
    .description("Scrape a website using Puppeteer")
    .action(async (baseURLs, options) => {
    const scrapper = new scrap_1.Scrapper(options);
    if (options.crawl) {
        await scrapper.start(baseURLs, "crawler");
    }
    else {
        await scrapper.start(baseURLs, "default");
    }
});
commander_1.program
    .command("generate-config")
    .argument("<outDir", "Where the config is stored")
    .argument("<fileName>", "File name")
    .action(async () => { });
commander_1.program
    .command("test")
    .option("--test <arg1>")
    .action((options) => {
    console.log();
});
commander_1.program.parse(process.argv);
