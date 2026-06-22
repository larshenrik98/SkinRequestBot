# Rust server (SkinBox in-game)

Players **request in Discord**, but skins are still added **in-game** via SkinBox console commands.

## Required on the server

1. **SkinBox** (ChaosCode / k1lly0u) — purchase separately, not included in this repo  
2. **Oxide.Ext.Chaos** + **ChaosExtensionDownloader**  
3. Optional: **PlayerDLCAPI** (recommended for DLC ownership checks)

## Flow

```
Discord /skinrequest  →  staff clicks Approve  →  RCON: skinbox.addskin {id}
                                                  →  SkinBox updates oxide/config/SkinBox.json live
```

Players still use SkinBox normally in-game (`/skinbox`, `/sb`) to **apply** skins. This project only handles **request + approve**.

## Disable in-game requests

Edit `oxide/config/SkinBox.json`:

- Set `"Commands to request a skin": []`
- Set `"Allow skin requests": false`
- Clear `"Discord webhook for incoming skin requests"`

See `SkinBox.snippet.json` for a template.

## Verify

After approve in Discord, run in server console:

```
o.reload SkinBox
```

Or check that the skin ID appears under `"Imported Workshop Skins"` in config.
