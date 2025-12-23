# REDSTONE COURIER PROTOCOL

A Minecraft-themed 8-phase decoding challenge website. Designed as a "late gift" experience where the recipient decodes puzzles to unlock a GPU tracking number.

## Quick Start

1. Open `index.html` in any modern browser
2. Login with:
   - Operator ID: `Ezra`
   - Session Key: `RCP-2025-XMAS-COURIER`

No build step required. Works offline after initial load.

## Configuration

Edit `config.js` to customize the challenge. All settings are at the top of the file:

### Essential Settings

```javascript
// Deadline (must be in ISO 8601 format with timezone)
deadlineISO: "2025-12-29T23:59:00-07:00",  // Dec 29 2025 11:59 PM MST

// Login credentials
operatorId: "Ezra",
sessionKey: "RCP-2025-XMAS-COURIER",

// Minecraft world download link
worldDownloadLink: "https://example.com/your-world.zip",

// Binding code visible at spawn in the Minecraft world
bindingCode: "OBSIDIAN-FLUX-7742",

// Phase 5: Binary artifact decoded value
phase5DecodedToken: "REDSTONE",

// Phase 6: Vault coordinates
coordsX: 128,
coordsY: 64,
coordsZ: -256,

// Vault key shown after coordinate verification
vaultKey: "AMETHYST-PROTOCOL-ACTIVE",

// Phase 7: Decoded shard values
shardADecoded: "1Z",       // Binary encoded prefix
shardBDecoded: "999YW",    // Base64 encoded core
shardCDecoded: "12345678", // Crafter encoded suffix

// Final tracking number (revealed after Phase 8)
trackingNumber: "1Z999YW12345678",
```

### Creating the Minecraft World

Your Minecraft world should contain:

1. **At spawn:** A sign or visible text showing the BINDING CODE
2. **Hidden somewhere:** A binary artifact (signs, books, or blocks representing binary)
3. **At specific coordinates:** A vault structure with the three shards
4. **Near vault:** Indicator showing order is "Prefix, Core, Suffix"

### Example Shard Encodings

**Shard A (Binary):**
If decoded value is `1Z`, the binary would be:
```
00110001 01011010
```

**Shard B (Base64):**
If decoded value is `999YW`, the Base64 would be:
```
OTk5WVc=
```

**Shard C (Crafter Encoding):**
Create your own Minecraft-themed counting system. Example:
- Use stacks (64 items = 64)
- Use different item types to represent digits
- Document the encoding in-game

## Deployment

### Option 1: Local File
Simply double-click `index.html` to open in browser.

### Option 2: GitHub Pages
1. Push to a GitHub repository
2. Go to Settings > Pages
3. Select "Deploy from branch" > main > root
4. Site will be at `https://username.github.io/repo-name`

### Option 3: Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel` in the project directory
3. Follow prompts

### Option 4: Netlify
1. Drag the folder to [netlify.com/drop](https://app.netlify.com/drop)
2. Site is immediately live

### Option 5: Any Static Host
Upload all files (index.html, config.js, app.js, styles.css) to any web server.

## Features

### Phases
1. **Whitelist Protocol** - Multiple choice about Minecraft spawn
2. **Origin Assertion** - Text input identifying spawn concept
3. **Language of Machines** - 3 checkpoints about binary/bytes
4. **World Link Established** - Enter binding code from Minecraft world
5. **The Codex of Bits** - Paste binary artifact and decoded ASCII
6. **Coordinate Verification** - Enter X/Y/Z of vault location
7. **Three Shards** - Decode binary, Base64, and crafter-encoded shards
8. **Courier Vision** - Final assembly with ordering rule

### Hint System
Each failed submission reveals the next hint tier:
- Tier 1: Vague nudge
- Tier 2: Clearer direction
- Tier 3: The answer (safety net)

### Workbench Tools
Unlock as you progress:
- **Byte Grouper** (Phase 3): Format binary into 8-bit groups
- **Artifact Integrity** (Phase 4): Validate binary structure
- **Base Reference** (Phase 5): Number base cheat sheet
- **Symbol Counter** (Phase 7): Character frequency analysis

### Timer & Status
- Green orb: >48 hours remaining
- Gold orb (pulsing): 12-48 hours remaining
- Red orb (pulsing): <12 hours remaining
- Black orb: Expired

### Expiry Behavior
When deadline passes:
- Site becomes read-only
- Banner displays: "AUTHORIZATION WINDOW CLOSED"
- All progress remains visible
- Tracking number stays locked (unless already revealed)

## Admin Reset

To reset all progress:
1. Hold Shift + Alt and click the gear icon (top right)
2. Enter the session key
3. Click "RESET ALL PROGRESS"

## Browser Support

Works in all modern browsers:
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

Mobile-responsive design works on phones and tablets.

## File Structure

```
RedstoneCourierProtocol/
├── index.html      # Main HTML structure
├── styles.css      # All styling
├── config.js       # Editable configuration
├── app.js          # Application logic
├── README.md       # This file
└── world/          # Place Minecraft world files here
```

## Customization Tips

### Changing the Theme
Edit CSS variables in `styles.css`:
```css
:root {
  --redstone: #ff3333;      /* Red accents */
  --amethyst: #a855f7;      /* Purple accents */
  --emerald: #10b981;       /* Success green */
  --slate-darkest: #0a0c0f; /* Background */
}
```

### Adding More Phases
1. Add phase definition in `PHASES` array (app.js)
2. Create `renderPhaseXForm()` function
3. Create `submitPhaseX()` function
4. Add case in `renderPhaseContent()` switch

### Changing Difficulty
- Modify hint texts in `HINTS` object
- Adjust answer matching (case sensitivity, partial matches)
- Add more checkpoints to phases

## License

Personal project - feel free to use and modify for your own gift experiences.
