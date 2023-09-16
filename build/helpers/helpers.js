"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSpinnerResult = exports.stringToArray = void 0;
const chalk_1 = __importDefault(require("chalk"));
function stringToArray(string) {
    if (/^\s*\[.*\]\s*$/.test(string)) {
        return JSON.parse(string);
    }
    else {
        return [string];
    }
}
exports.stringToArray = stringToArray;
function updateSpinnerResult(spinner, result) {
    spinner.text += ` | ${chalk_1.default.blue.bold(result.checkName)}: ${chalk_1.default[result.result === "OK" ? "green" : "red"].bold(result.result)}`;
}
exports.updateSpinnerResult = updateSpinnerResult;
