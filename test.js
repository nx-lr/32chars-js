const fs = require("fs");
require("colors");
const Diff = require("diff");
const {result} = require("./output");

console.log(`Running test...`);

const text = fs.readFileSync("./input.txt", "utf8");
console.log(`Compared: ${text == result}.`);

const diff = Diff.diffChars(text, result);
diff.forEach(part => {
  const color = part.added ? "green" : part.removed ? "red" : "grey";
  process.stderr.write(part.value[color]);
});

console.log(`Writing evaluated output...`);
fs.writeFileSync("./result.txt", result);
