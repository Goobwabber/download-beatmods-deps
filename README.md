# Download Beatmods Dependencies

An action that downloads and extracts Beat Saber mod dependencies using a mod's manifest file. Mods are pulled from https://beatmods.com/.
Manifest is expected to be UTF-8 encoded.

## Usage

```yaml
- name: Download Dependencies
  uses: Goobwabber/download-beatmods-deps
  with:
    # Optional, manifest location
    manifest: ${{github.workspace}}/manifest.json
    # Optional, extract location
    path: ${{github.workspace}}/Refs
```
