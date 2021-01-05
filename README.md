# Download Beatmods Dependencies

An action that downloads and extracts beatsaber mod dependencies using a mod's manifest file. Mods are pulled from https://beatmods.com/.

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
