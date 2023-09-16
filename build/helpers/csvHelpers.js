"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readCsvFile = void 0;
const csv_parser_1 = __importDefault(require("csv-parser"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function readCsvFile(csvFilePath) {
    const isAbsolutePath = path_1.default.isAbsolute(csvFilePath);
    const absolutePath = isAbsolutePath
        ? csvFilePath
        : path_1.default.resolve(__dirname, "../", csvFilePath);
    return new Promise((resolve, reject) => {
        const urlArray = [];
        fs_1.default.createReadStream(absolutePath)
            .pipe((0, csv_parser_1.default)({ headers: false }))
            .on("data", (row) => {
            if (row[0]) {
                urlArray.push(row[0]);
            }
        })
            .on("end", () => {
            resolve(urlArray);
        })
            .on("error", (error) => {
            reject(error);
        });
    });
}
exports.readCsvFile = readCsvFile;
