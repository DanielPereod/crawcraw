import puppeteer, { Browser, Page } from "puppeteer";
import { createArrayCsvWriter } from "csv-writer";
import { readCsvFile } from "../helpers/csvHelpers";
import { loadConfig } from "../helpers/configHelper";
import chalk from "chalk";
import ora from "ora";
import { stringToArray, updateSpinnerResult } from "../helpers/helpers";
import { ScrapperOption, Config } from "../types/scrapper";



export class Scrap {
  private scrapedData: any[] = [];
  private spinner: ora.Ora;
  private browser!: Browser;
  private page!: Page;
  private options: ScrapperOption;

  constructor(options: ScrapperOption) {
    this.spinner = ora("Starting to scrap");
    this.options = options;
  }

  private async initPuppeteer() {
    this.browser = await puppeteer.launch({
      headless: "new",
    });
    this.page = await this.browser.newPage();
    this.page.setDefaultNavigationTimeout(this.options.timoutMiliseconds || 2000);
    await this.page.setRequestInterception(true);
    await this.page.setCacheEnabled(false);
  }

  private async scrapWithConfig(config: Config, url: string) {
    const scriptsNames = Object.keys(config.scripts);
    for (let i = 0; i < scriptsNames.length; i++) {
      const script = config.scripts[scriptsNames[i]];
      const result = await script(this.page, scriptsNames[i]);
      updateSpinnerResult(this.spinner, result);
      this.scrapedData.push([url, result.checkName, result.result, result.data]);
    }
  }

  private async scrapFor(type: "selector" | "function", url: string) {
    const elementArray = stringToArray(this.options.hasElement);

    for (let i = 0; i < elementArray.length; i++) {
      const elementToFind = elementArray[i];

      try {
        if (type === "function") {
          await this.page.waitForFunction(elementToFind);
        } else if (type === "selector") {
          await this.page.waitForSelector(elementToFind);
        }
        this.scrapedData.push([url, elementToFind, "OK"]);
        this.spinner.text += ` | ${chalk.blue.bold(elementToFind)}:${chalk.green.bold("OK")}`;
      } catch (error) {
        this.scrapedData.push([url, elementToFind, "KO"]);
        this.spinner.text += ` | ${chalk.blue.bold(elementToFind)}:${chalk.red.bold("KO")}`;
      }
    }
  }

  public async scrap(urlsCSVRoute: string) {
    await this.initPuppeteer();
    const urls = await readCsvFile(urlsCSVRoute);

    this.page.on("request", (request) => {
      request.continue();
    });

    this.page.on("response", (response) => {});
    this.spinner.spinner = "pipe";

    for (let i = 0; i < urls.length; i++) {
      try {
        const url = urls[i];

        this.spinner.start();
        this.spinner.spinner = "dots4";
        this.spinner.text = `${chalk.bgMagenta.bold(` ${"Navigating"} `)} ${url}`;

        await this.page.goto(url, {
          waitUntil: "networkidle0",
        });

        if (this.options.configFileRoute) {
          const config = await loadConfig(this.options.configFileRoute);
          await this.scrapWithConfig(config, url);
        }

        if (this.options.hasElement) {
          await this.scrapFor("selector", url);
        }

        if (this.options.hasFunction) {
          await this.scrapFor("function", url);
        }

        this.spinner.succeed();
      } catch (error) {
        this.spinner.fail();
      } finally {
        this.spinner.stop();
      }
    }

    if (this.options.outDir) {
      const csvWriter = createArrayCsvWriter({
        path: this.options.outDir,
        header: ["URL", "CheckName", "Result"],
      });

      this.spinner.start(`Saving results into ${this.options.outDir}`)
      await csvWriter.writeRecords(this.scrapedData);
      this.spinner.succeed(`Results saved into ${this.options.outDir}!`)
    }


    this.browser.close();
  }
}
