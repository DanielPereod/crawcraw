import { Page } from "puppeteer";

type ScrapperResult = {
  checkName: string;
  result: string;
  data?: string | undefined;
};

type ScrapperOption = {
  outDir: string;
  configFileRoute: string;
  hasElement: string;
  hasFunction: string;
  timoutMiliseconds: number
};

type Config = {
  interceptedRequests: { name: string; url: string }[];
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