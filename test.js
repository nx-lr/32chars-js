const fs = require("fs");
const {result} = require("./output");

const text = fs.readFileSync("./input.txt", "utf8");
console.log(`Compared: ${text === result}`);
fs.writeFileSync("./result.txt", result);
