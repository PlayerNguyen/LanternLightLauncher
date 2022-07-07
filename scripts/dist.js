const fs = require("fs");
const chalk = require("chalk");
const builder = require("electron-builder");
const Platform = builder.Platform;
/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
const options = {
  files: [
    // "**/*",
    "./dist/src/**/*",
    "!./.parcel-cache",
    "!./scripts",
    "!._*",
    "!./.github",
    "!**/node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}",
    "!**/node_modules/*/{test,__tests__,tests,powered-test,example,examples}",
    "!**/node_modules/*.d.ts",
    "!**/node_modules/.bin",
    "!**/*.{iml,o,hprof,orig,pyc,pyo,rbc,swp,csproj,sln,xproj}",
    "!.editorconfig",
    "!**/._*",
    "!**/{.DS_Store,.git,.hg,.svn,CVS,RCS,SCCS,.gitignore,.gitattributes}",
    "!**/{__pycache__,thumbs.db,.flowconfig,.idea,.vs,.nyc_output}",
    "!**/{appveyor.yml,.travis.yml,circle.yml}",
    "!**/{npm-debug.log,yarn.lock,.yarn-integrity,.yarn-metadata.json}",
  ],
  // "store” | “normal” | "maximum". - For testing builds, use 'store' to reduce build time significantly.
  compression: "normal",
  // removePackageScripts: true,
  directories: {
    output: "out",
  },
  extraMetadata: {
    main: "./dist/src/App.js",
  },
  // buildDependenciesFromSource: false,
  beforeBuild: async () => {
    // console.log(chalk.yellow(`Checking for src...`));
    if (!fs.existsSync("dist/src")) {
      console.error(chalk.red(`No dist/src directory found`));
      // tips using npm build
      console.log(
        chalk.gray(
          `💡 Ensure run "${chalk.yellow(`npm run build`)}" before building`
        )
      );
      process.exit(1);
    }
  },
};

// Promise is returned
builder
  .build({
    targets: Platform.MAC.createTarget(),
    config: options,
  })
  .then((result) => {
    console.log(JSON.stringify(result));
  })
  .catch((error) => {
    console.error(chalk.red(error));
    console.error(chalk.gray(error.stack));
  });
