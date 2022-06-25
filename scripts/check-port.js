const detectPort = require("detect-port");
const chalk = require("chalk");

const port = process.env.PORT || 1234;

console.log(chalk.bgBlueBright(`Checking availability port ${port}...`));

detectPort(port, (_err, availablePort) => {
  console.log(availablePort);
  if (parseInt(port) !== availablePort) {
    throw new Error(
      chalk.whiteBright.bgRed.bold(
        `Port "${port}" on "localhost" is already in use. Please use another port. ex: PORT=4343 npm start`
      )
    );
  } else {
    process.exit(0);
  }
});
