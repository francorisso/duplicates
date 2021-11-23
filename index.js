const checksum = require('checksum');
const fs = require('fs');
const { execSync } = require('child_process');
const prompt = require('prompt-sync')({ sigint: true });

// console.log(require('prompt-sync')()('tell me something about yourself: '))
execSync("mkdir -p ./trash");

const [directory] = process.argv.slice(2);
const filenames = fs.readdirSync(directory);

const duplicates = [];
const hashes = new Map();

const getChecksum = (filename) =>
    new Promise((res, rej) => checksum.file(filename, (err, hash) => {
        if (err) {
            rej(err);
        } else {
            res(hash);
        }
    }));

Promise.all(filenames.map(async filename => {
    try {
        const path = `${directory}/${filename}`;
        const hash = await getChecksum(path);
        if (hashes.has(hash)) {
            duplicates.push({ path, hash, filename });
        } else {
            hashes.set(hash, filename);
        }

    } catch (e) {
        // console.error(e);
    }
})).then(() => {
    const toMove = [];
    duplicates.forEach(({ path, filename, hash }) => {
        console.log(`${filename} is a duplicate of ${hashes.get(hash)}`);
        toMove.push(`"${path}"`);
    });
    console.log("");
    const answer = prompt("Delete all the files? (y/n) ");
    if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
        console.log("Moving to /trash ", toMove.length, " files");
        execSync(`mv ${toMove.join(" ")} ./trash`);
    }
});

