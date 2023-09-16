#!/usr/bin/env node

import { program } from "commander";
import { Scrap } from "./commands/scrap";
import os from "os";
import { startCrawler } from "./commands/crawl";
import { ScrapperOption } from "./types/scrapper";

program
  .name("crawcraw")
  .description("CLI to some JavaScript string utilities")
  .version("0.8.0");

program
  .command("scrape")
  .argument("<urlsCSVRoute>", "URLs csv route")
  .option(
    "--outDir <outDir>",
    `Output data path (default: ${os.homedir()}/output.csv)`,
    `${os.homedir()}/output.csv`
  )
  .option("--config <configFileRoute>", "Use a config file", "./config.js")
  .option("--hasElement <hasElement>", "Search if element exists in page")
  .option("--hasRequest <hasRequest>", "Search if request is made on page")

  .description("Scrape a website using Puppeteer")
  .action(async (urlsCSVRoute, options: ScrapperOption) => {
    const scrap = new Scrap(options);
    await scrap.scrap(urlsCSVRoute);
  });

program
  .command("crawl")
  .argument("<base_url>", "URL to start crawling")
  .option("--outDir <outDir>", `Output data path (default: ${os.homedir()}/crawler_urls.csv)`, `${os.homedir()}/crawler_urls.csv`)
  .option("--timeout <timoutMiliseconds>", "Set the default timeout for puppeteer in miliseconds (default: 2000)")
  .description("Crawl a website using Puppeteer")
  .action(async (base_url, options) => {
    await startCrawler(base_url, options.outDir).catch((error) =>
      console.error("Error:", error)
    );
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
