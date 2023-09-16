#!/usr/bin/env node

import { program } from "commander";
import { Scrapper } from "./commands/scrap";
import os from "os";

program
  .name("crawcraw")
  .description("CLI to some JavaScript string utilities")
  .version("0.8.0");

program
  .command("scrape")
  .argument("<baseURLs>", "URLs csv route or starting URL if crawling")
  .option("-od, --outDir <outDir>",`Output data path (default: ${os.homedir()}/output.csv)`,`${os.homedir()}/output.csv`)
  .option("-c, --config <configFileRoute>", "Use a config file")
  .option("-he, --hasElement <hasElement>", "Search if element exists in page")
  .option("-hr, --hasRequest <hasRequest>", "Search if request is made on page")
  .option("-to, --timeout <timoutMiliseconds>", "Set the default timeout for puppeteer in miliseconds (default: 2000)")
  .option("-cw, --crawl", "URL to start crawling")
  .description("Scrape a website using Puppeteer")
  .action(async (baseURLs, options) => {
    const scrapper = new Scrapper(options);
    if (options.crawl) {
      await scrapper.start(baseURLs, "crawler");
    } else {
      await scrapper.start(baseURLs, "default");
    }
  });

program
  .command("generate-config")
  .argument("<outDir", "Where the config is stored")
  .argument("<fileName>", "File name")
  .action(async () => {});

program
  .command("test")
  .option("--test <arg1>")
  .action((options) => {
    console.log();
  });

program.parse(process.argv);
