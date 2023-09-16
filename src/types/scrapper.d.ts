import { Page } from "puppeteer";

type ScrapperType = "default" | "crawler"

type ScrapperResult = {
  checkName: string;
  result: string;
  data?: string | undefined;
};

type ScrapperOption = {
  outDir: string;
  config: string;
  hasElement: string;
  hasFunction: string;
  timoutMiliseconds: number;
  crawlURL: string;
};

type CrawlerOptions = {
  baseURL: string;
  outDir: string;
  timoutMiliseconds: number;
}

type Config = {
  exclude_hosts: string[];
  exclude_text: string[];
  block_request: string[];
  interceptedRequests: { name: string; url: string | RegExp }[];
  scripts: {
    [key: string]: (
      page: Page,
      checkName: string
    ) => Promise<{
      checkName: string;
      result: string;
      data?: string;
    }>;
  };
};