import chalk from "chalk";
import ora from "ora";
import { ScrapperResult } from "../types/scrapper";

export function stringToArray(string: string) {
  if (/^\s*\[.*\]\s*$/.test(string)) {
    return JSON.parse(string);
  } else {
    return [string];
  }
}

export function updateSpinnerResult(spinner: ora.Ora, result: ScrapperResult) {
  spinner.text += ` | ${chalk.blue.bold(result.checkName)}: ${chalk[
    result.result === "OK" ? "green" : "red"
  ].bold(result.result)}`;
}
