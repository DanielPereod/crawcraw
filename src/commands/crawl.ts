import { createArrayCsvWriter } from "csv-writer";
import { Queue } from "../helpers/Queue";
import { CsvWriter } from "csv-writer/src/lib/csv-writer";
import { initPuppeteer } from "../helpers/puppeteerInit";

const urlsSet = new Set<string>();
const visitedSet = new Set<string>();
const urlQueue = new Queue<string>();

const EXLUDE_HOSTS = [
    "www.wizinkcenter.es",
    "play.google.com",
    "twitter.com",
    "www.instagram.com",
    "apps.apple.com",
    "www.google.es",
];
const EXCLUDE_TEXT = [".pdf", "linkedin", "mailto:", ".PDF"];

async function crawl(url: string, csvWriter: CsvWriter<any[]>) {
    if (!url || visitedSet.has(url)) return;

    await csvWriter.writeRecords([[url]]);
    await initPuppeteer(async (page) => {
        try {
            visitedSet.add(url);

            page.on("request", (request) => {
                if (request.url().includes("utag.js")) {
                    request.abort();
                } else {
                    request.continue();
                }
            });

            await page.goto(url);

            const links = await page.$$("a");

            for (const link of links) {
                try {
                    const href = await link.getProperty("href");
                    const urlString: string | undefined =
                        await href.jsonValue();

                    if (
                        !urlString ||
                        EXLUDE_HOSTS.includes(new URL(urlString).host) ||
                        EXCLUDE_TEXT.some((substring) =>
                            urlString.includes(substring)
                        )
                    )
                        continue;

                    if (
                        urlString.includes("wizink") ||
                        urlString.startsWith("/") ||
                        urlString.startsWith(url)
                    ) {
                        const generatedURL = new URL(urlString, url).href.split(
                            "#"
                        )[0];

                        urlsSet.add(generatedURL);

                        if (!visitedSet.has(generatedURL)) {
                            urlQueue.enqueue(generatedURL);
                        }
                    }
                } catch (error) {
                    console.log(error);
                }
            }
        } catch (err) {
            console.log("Failed to fetch page: ", err);
        } finally {
            const nextURL = urlQueue.peek();
            urlQueue.dequeue();

            if (nextURL) {
                await crawl(nextURL, csvWriter);
            }
        }
    });
}

export async function startCrawler(BASE_URL: string, csvPath: string) {
    const csvWriter = createArrayCsvWriter({
        path: csvPath,
        header: ["URL"],
    });

    await crawl(BASE_URL, csvWriter);
}
