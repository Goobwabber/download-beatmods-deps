const core = require('@actions/core');
const fetch = require('node-fetch');
const semver = require('semver');
const unzip = require('unzipper');
const fs = require("fs");

main().then(() => core.info("Complete!"))

async function main() {
    try {
        const manifestPath = core.getInput("manifest");
        const extractPath = core.getInput("path");
        const rawAliases = core.getInput("aliases");

        const depAliases = JSON.parse(rawAliases);

        let manifestStringData = fs.readFileSync(manifestPath, 'utf8');
        if (manifestStringData.startsWith('\uFEFF')) {
            core.warning("BOM character detected at the beginning of the manifest JSON file. Please remove the BOM from the file as it does not conform to the JSON spec (https://datatracker.ietf.org/doc/html/rfc7159#section-8.1) and may cause issues regarding interoperability.")
            manifestStringData = manifestStringData.slice(1);
        }

        const manifest = JSON.parse(manifestStringData);
        core.info("Retrieved manifest of '" + manifest.id + "' version '" + manifest.version + "'");

        if (depAliases != {}) {
            const aliasKeys = Object.keys(depAliases);
            aliasKeys.forEach(key => {
                core.info(`Given alias '${key}': '${depAliases[key]}'`);
                manifest.dependsOn[depAliases[key]] = manifest.dependsOn[key];
            });
        }

        const gameVersions = await fetchJson("https://versions.beatmods.com/versions.json");
        const versionAliases = await fetchJson("https://alias.beatmods.com/aliases.json");

        const version = gameVersions.find(x => x === manifest.gameVersion || versionAliases[x].some(y => y === manifest.gameVersion));
        if (version == null) {
            throw new Error("Game version '" + manifest.gameVersion + "' doesn't exist.");
        }

        core.info("Fetching mods for game version '" + version + "'");
        const mods = await fetchJson("https://beatmods.com/api/v1/mod?gameVersion=" + version);

        for (let depName of Object.keys(manifest.dependsOn)) {
            const depVersion = manifest.dependsOn[depName];
            const dependency = mods.find(x => (x.name === depName || x.name == depAliases[depName]) && semver.satisfies(x.version, depVersion));

            if (dependency != null) {
                const depDownload = dependency.downloads.find(x => x.type === "universal").url;
                core.info("Downloading mod '" + depName + "' version '" + dependency.version + "'");
                await download("https://beatmods.com" + depDownload, extractPath);
            } else {
                core.warning("Mod '" + depName + "' version '" + depVersion + "' not found.");
            }
        }
    } catch (error) {
        core.setFailed(error.message);
    }
}

async function fetchJson(url) {
    const response = await fetch(url);
    return await response.json();
}

async function download(url, extractPath) {
    const response = await fetch(url);
    await response.body.pipe(unzip.Extract({path: extractPath}));
}
