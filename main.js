const core = require('@actions/core');
const fetch = require('node-fetch');
const semver = require('semver');
const unzip = require ('unzipper');
const fs = require("fs");

async function main() {
    try {
        const manifestPath = core.getInput("manifest");
        const extractPath = core.getInput("path");

        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        core.info("Retrieved manifest of '" + manifest.id + "' version '" + manifest.version + "'");

        const gameVersions = await fetchJson("https://versions.beatmods.com/versions.json");
        const versionAliases = await fetchJson("https://alias.beatmods.com/aliases.json");

        const version = gameVersions.find(x => x == manifest.gameVersion || versionAliases[x].some(y => y == manifest.gameVersion));
        if (version == null) {
            throw new Error("Game version '" + manifest.gameVersion + "' doesn't exist.");
        }

        core.info("Fetching mods for game version '" + version + "'");
        const mods = await fetchJson("https://beatmods.com/api/v1/mod?gameVersion=" + version);

        for(var depName of Object.keys(manifest.dependsOn)) {
            var depVersion = manifest.dependsOn[depName];
            var dependency = mods.find(x => x.name == depName && semver.satisfies(x.version, depVersion));

            if (dependency != null) {
                var depDownload = dependency.downloads.find(x => x.type == "universal").url;
                core.info("Downloading mod '" + depName + "' version '" + dependency.version + "'");
                await download("https://beatmods.com" + depDownload, extractPath);
            }else{
                core.warning("Mod '" + depName + "' version '" + depVersion + "' not found.");
            }
        }

        core.info("Complete!");
    } catch(error) {
        core.setFailed(error.message);
    }
}

async function fetchJson(url) {
    const response = await fetch(url);
    return await response.json();
}

async function download(url, extractPath) {
    const response = await fetch(url);
    await response.body.pipe(unzip.Extract({ path: extractPath }));
}