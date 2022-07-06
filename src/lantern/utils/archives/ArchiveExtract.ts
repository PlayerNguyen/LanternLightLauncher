import fs from "fs";
import path from "path";
import tar from "tar-fs";
import gzip from "gunzip-maybe";
import unzipper from "unzipper";

async function extract(input: string, output: string) {
  return new Promise((res, rej) => {
    // Tar.gz handle
    let fileName = path.basename(input);
    let ext = path.extname(fileName);

    let stream = fs.createReadStream(input);
    stream.on("error", rej);

    if (ext === ".gz") {
      stream.pipe(gzip()).pipe(tar.extract(output)).once("finish", res);
    }
    // Zip handle
    else if (ext === ".zip") {
      // let stream = fs.createReadStream(input);
      stream.pipe(unzipper.Extract({ path: output })).once("finish", res);
    }

    // Other handle
    else throw new Error("Unsupported file type " + ext);
  });
}

export const ArchiveExtract = {
  extract,
};
