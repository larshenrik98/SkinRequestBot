# SkinRequestBot

Discord skin requests for Rust servers running **SkinBox**. Players suggest Workshop skins in Discord; staff approve with one click; the bot sends `skinbox.addskin` / `skinbox.addcollection` to your game server.

**Discord for requests · SkinBox in-game for the actual skin list**

## Architecture

```
Player: /skinrequest <workshop link>
    ↓
Discord embed + Approve button
    ↓
Staff clicks Approve
    ↓
RCON → skinbox.addskin 123456789
    ↓
SkinBox on Rust server imports the skin
```

## Quick start (standalone bot)

1. `npm install`
2. Copy `.env.example` → `.env` and fill in values
3. `npm start`

### Discord setup

- Create a bot at [Discord Developer Portal](https://discord.com/developers/applications)
- Enable **Message Content Intent**
- Invite with `applications.commands` + `bot` scopes
- Set `SKIN_REQUEST_CHANNEL_ID` and `SKIN_STAFF_ROLE_ID`

### Server connection

**PineHosting (default):**

```env
RCON_PROVIDER=pinehost
PINEHOST_SERVER_ID=your-server-uuid
PINEHOST_API_TOKEN=ptlc_...
```

**Custom webhook:**

```env
RCON_PROVIDER=webhook
RCON_WEBHOOK_URL=https://your-panel/api/command
RCON_WEBHOOK_AUTH=Bearer your-token
```

The webhook must accept `POST` with JSON `{ "command": "skinbox.addskin 123" }`.

## MercyBot integration

1. Copy `integration/mercy-bot-feature.js` → `features/skinrequest.js` in your MercyBot repo  
2. Use the same `.env` variables  
3. Remove `features/skinvoting.js` if you no longer use SkinBox in-game webhook requests  

## Rust server

See [server/SETUP.md](server/SETUP.md). SkinBox itself is **not** included — you need a licensed copy from ChaosCode.

## What this repo does **not** include

| Item | Reason |
|---|---|
| `SkinBox.cs` | Third-party paid plugin |
| Live skin lists / API keys | Server-specific secrets |
| In-game `/skinrequest` | Disabled; Discord-only requests |

## Author

LarsHenrik98
