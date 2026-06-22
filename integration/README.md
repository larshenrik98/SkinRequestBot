# MercyBot integration

MercyBot already loads `features/*.js`. Two options:

## Option A — Standalone bot (recommended for GitHub repo)

Run this project on its own with `npm start`. MercyBot does not need `skinrequest.js`.

Disable duplicate handling in MercyBot:

- Remove or rename `features/skinrequest.js`
- Remove `features/skinvoting.js` (only needed for SkinBox in-game webhook)

## Option B — Embed in MercyBot

1. Copy the whole `SkinRequestBot` folder into your mercy repo, e.g. `skinrequest-bot/`
2. Replace `features/skinrequest.js` with:

```js
require('dotenv').config({ path: require('path').join(__dirname, '../skinrequest-bot/.env') });
module.exports = require('../skinrequest-bot/src/skinrequest');
```

3. Remove `features/skinvoting.js`
4. Use the same `.env` keys as `.env.example` (can merge into Mercy `.env`)

## In-game (both options)

Staff approve in Discord → bot sends `skinbox.addskin` / `skinbox.addcollection` → **SkinBox on the Rust server** updates.

See `server/SETUP.md` for SkinBox config (disable in-game `/skinrequest`, keep SkinBox for players).
