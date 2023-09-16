import chalk from "chalk";
import { createArrayCsvWriter } from "csv-writer";
import { CsvWriter } from "csv-writer/src/lib/csv-writer";
import ora from "ora";
import path from "path";
import puppeteer, { Browser, Page } from "puppeteer";
import { Queue } from "../helpers/Queue";
import { readCsvFile } from "../helpers/csvHelpers";
import { stringToArray } from "../helpers/helpers";
import { Config, ScrapperOption, ScrapperType } from "../types/scrapper";

export class Scrapper {
  private scrapedData: any[] = [];
  private urlsSet = new Set<string>();
  private visitedSet = new Set<string>();
  private urlQueue = new Queue<string>();
  private spinner: ora.Ora;
  private browser!: Browser;
  private page!: Page;
  private options: ScrapperOption;
  private csvWriter: CsvWriter<any[]> | undefined;
  private config: Config | undefined;

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

    this.page.on("request", (request) => {
      if (this.config?.block_request?.includes(request.url())) {
        request.abort();
      } else {
        request.continue();
      }
    });

    this.page.on("response", (request) => {});
  }

  private async loadConfig(configPath: string) {
    if (!configPath) return;
    try {
      this.spinner.text = `Loading configuration from ${configPath}`;

      const isAbsolutePath = path.isAbsolute(configPath);
      const absolutePath = isAbsolutePath
        ? configPath
        : path.resolve(__dirname, "../", configPath);
      const configModule = await import(absolutePath);

      this.config = configModule.default;
      this.spinner.succeed("Configuration file loaded");
    } catch (error) {
      this.spinner.fail(`Error loading configuration: ${error}`);
    }
  }

  private async scrapWithConfig(url: string) {
    if (!this.config) return;
    const scriptsNames = Object.keys(this.config.scripts);
    for (let i = 0; i < scriptsNames.length; i++) {
      const script = this.config.scripts[scriptsNames[i]];
      const result = await script(this.page, scriptsNames[i]);
      this.spinner.text += ` | ${chalk.blue.bold(result.checkName)}:${chalk[
        result.result ? "green" : "red"
      ].bold(result.result)}`;

      this.scrapedData.push([url, result.checkName, result.result, result.data]);
      this.csvWriter?.writeRecords([[url, result.checkName, result.result, result.data]]);
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
        this.csvWriter?.writeRecords([[url, elementToFind, "OK"]]);
        this.spinner.text += ` | ${chalk.blue.bold(elementToFind)}:${chalk.green.bold("OK")}`;
      } catch (error) {
        this.scrapedData.push([url, elementToFind, "KO"]);
        this.csvWriter?.writeRecords([[url, elementToFind, "KO"]]);
        this.spinner.text += ` | ${chalk.blue.bold(elementToFind)}:${chalk.red.bold("KO")}`;
      }
    }
  }

  private async navigate(urlsCSVRoute: string) {
    const urls = await readCsvFile(urlsCSVRoute);

    for (let i = 0; i < urls.length; i++) {
      try {
        const url = urls[i];

        this.spinner.start();
        this.spinner.spinner = "dots4";
        this.spinner.text = `${chalk.bgMagenta.bold(` ${"Navigating"} `)} ${url}`;

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
      } catch (error) {
        this.spinner.fail(
          `${chalk.bgRed.bold(` ${"Navigating"} `)} ${this.page.url()}: ${
            (error as any).message
          }`
        );
      } finally {
        this.spinner.stop();
      }
    }

    this.browser.close();
  }

  private async crawl(url: string) {
    if (!url || this.visitedSet.has(url)) return;

    this.spinner.text = `${chalk.bgMagenta.bold(` ${"Navigating"} `)} ${url}`;

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
          const urlString: string | undefined = await href.jsonValue();

          if (
            !urlString ||
            this.config?.exclude_hosts?.includes(new URL(urlString).host) ||
            this.config?.exclude_text?.some((substring) => urlString.includes(substring))
          )
            continue;

          if (
            //TODO: FIX THIS
            urlString.includes("some_text") || //Include multidomain
            urlString.startsWith("/") ||
            urlString.startsWith(url)
          ) {
            const generatedURL = new URL(urlString, url).href.split("#")[0];

            this.urlsSet.add(generatedURL);

            if (!this.visitedSet.has(generatedURL)) {
              this.urlQueue.enqueue(generatedURL);
            }
          }
        } catch (error) {
          this.spinner.fail(
            `${chalk.bgRed.bold(` ${"Navigating"} `)} ${this.page.url()}: ${
              (error as any).message
            }`
          );
        }
      }
    } catch (error) {
      this.spinner.fail(
        `${chalk.bgRed.bold(` ${"Navigating"} `)} ${this.page.url()}: ${
          (error as any).message
        }`
      );
    } finally {
      const nextURL = this.urlQueue.peek();
      this.urlQueue.dequeue();

      if (nextURL) {
        await this.crawl(nextURL);
      }
      this.browser.close();
    }
  }

  public async start(data: string, type: ScrapperType) {
    await this.loadConfig(this.options.config);
    await this.initPuppeteer();
    this.spinner.start("Starting");
    this.spinner.spinner = "pipe";

    this.csvWriter = createArrayCsvWriter({
      path: this.options.outDir,
    });

    if (type === "default") {
      await this.navigate(data);
    } else if (type === "crawler") {
      try {
        await this.crawl(data);
        this.spinner.succeed(`URLs stored in ${this.options.outDir}`);
      } catch (error) {
        this.spinner.fail(
          `${chalk.bgRed.bold(` ${"Navigating"} `)} ${this.page.url()}: ${
            (error as any).message
          }`
        );
      }
    }
  }
}
