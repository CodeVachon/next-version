import { COLOR } from "./color";
import chalk from "chalk";

export const log = (...args: any[]) => console.info(chalk.hex(COLOR.ORANGE)("#"), ...args);
export const logCmd = (...args: any[]) => console.info(chalk.hex(COLOR.CYAN)(">"), ...args);
