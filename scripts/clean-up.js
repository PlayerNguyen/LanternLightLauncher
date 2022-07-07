const fs = require("fs");
const chalk = require("chalk");

(async () => {
  const includeDirectories = [
    "dist",
    "logs",
    "out",
    "build",
    ".parcel-cache",
    ".nyc_output",
  ];
  includeDirectories.forEach(async (directory) => {
    console.log(`${chalk.gray(`• Cleaning...`)}\t${directory}`);

    // Remove all directory if exists
    if (fs.existsSync(directory)) {
      fs.rmdirSync(directory, { recursive: true });
    }

    console.log(`${chalk.green(`• Cleaned`)}\t`);
  });
})();
