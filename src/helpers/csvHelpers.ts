import csvParser from "csv-parser";
import fs from "fs";
import path from "path";

export async function readCsvFile(csvFilePath: string): Promise<string[]> {
  const isAbsolutePath = path.isAbsolute(csvFilePath);
  const absolutePath = isAbsolutePath
    ? csvFilePath
    : path.resolve(__dirname, "../", csvFilePath);
  return new Promise<string[]>((resolve, reject) => {
    const urlArray: string[] = [];

    fs.createReadStream(absolutePath)
      .pipe(csvParser({ headers: false }))
      .on("data", (row: { "0": string }) => {
        if (row[0]) {
          urlArray.push(row[0]);
        }
      })
      .on("end", () => {
        resolve(urlArray);
      })
      .on("error", (error: Error) => {
        reject(error);
      });
  });
}
