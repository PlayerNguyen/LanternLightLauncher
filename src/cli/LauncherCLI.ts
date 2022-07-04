import chalk from "chalk";
import { hideBin } from "yargs/helpers";
import yargs from "yargs";
import { argv } from "process";
import { getVersionManifest } from "../lantern/launcher/LauncherVersion";
import {
  buildGameFile,
  launchMinecraft,
} from "../lantern/launcher/LauncherGameAsset";
import { getLauncherAppData } from "../lantern/launcher/Launcher";

yargs(hideBin(argv))
  .command(
    "build <ver>",
    "build Minecraft game files, assets, runtime, and more...",
    (yargs) => {
      return yargs.positional("ver", {
        desc: "minecraft version to build",
        default: "latest",
      });
    },
    async (argv) => {
      if (argv.ver === undefined) {
        throw new Error(`Version cannot be ${argv.ver}`);
      }

      // Build for latest version
      let manifest = await getVersionManifest();

      let version: string | undefined;

      if (argv.ver === "latest") {
        version = manifest.latest.release;
      } else {
        // Check this version whether is available or not
        let searchVersion = manifest.versions.find(
          (_version) => _version.id === argv.ver
        );
        if (!searchVersion) {
          throw new Error(`Version not found in metadata ${argv.ver}`);
        }
        version = searchVersion.id;
      }

      // Build a game data for version
      buildGameFile(version).then(() => {
        console.log(
          chalk.bgGreen(
            chalk.black(
              `Completely built game files into ${getLauncherAppData()}`
            )
          )
        );
      });
    }
  )
  .command(
    `launch <ver>`,
    "Launch minecraft with specific version",
    (yargs) => {
      return yargs
        .positional("ver", {
          desc: "minecraft version to launch",
          default: "latest",
        })
        .positional("username", {
          desc: "username to join",
        });
    },
    async (argv) => {
      if (argv.ver === undefined) {
        throw new Error(`Version cannot be ${argv.ver}`);
      }

      // Build for latest version
      let manifest = await getVersionManifest();

      let version: string | undefined;

      if (argv.ver === "latest") {
        version = manifest.latest.release;
      } else {
        // Check this version whether is available or not
        let searchVersion = manifest.versions.find(
          (_version) => _version.id === argv.ver.trim()
        );
        if (!searchVersion) {
          throw new Error(`Version not found in metadata ${argv.ver}`);
        }
        version = searchVersion.id;
      }

      // handler
      let username: string = "Notch";
      if (argv.username) {
        username = argv.username as string;
      }

      await launchMinecraft(version, username);
    }
  )
  .parse();
