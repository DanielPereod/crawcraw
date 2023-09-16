"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initPuppeteer = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
async function initPuppeteer(callback) {
    const browser = await puppeteer_1.default.launch({
        headless: "new",
    });
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    await page.setCacheEnabled(false);
    await callback(page);
    await browser.close();
}
exports.initPuppeteer = initPuppeteer;
