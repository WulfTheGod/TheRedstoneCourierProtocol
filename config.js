/**
 * REDSTONE COURIER PROTOCOL - CONFIGURATION
 * ==========================================
 * Edit these values to customize the challenge.
 * All answers are case-insensitive unless noted.
 */

const CONFIG = {
  // ═══════════════════════════════════════════════════════════════
  // DEADLINE & IDENTITY
  // ═══════════════════════════════════════════════════════════════

  // Deadline: Dec 27, 2025 at 1:00 PM America/Denver (MST)
  // Package arrives between 2-7 PM, so deadline is 1 PM to give time
  // MST is UTC-7 (December is standard time)
  deadlineISO: "2025-12-27T13:00:00-07:00",

  // Operator identity (case-sensitive for display, case-insensitive for validation)
  operatorId: "Ezra",

  // Session key printed on the physical card
  sessionKey: "RCP-2025-XMAS-COURIER",

  // ═══════════════════════════════════════════════════════════════
  // PHASE 1-3: CONCEPTUAL QUESTIONS (pre-configured, no changes needed)
  // ═══════════════════════════════════════════════════════════════

  // Phase 1: Whitelist Protocol - Answer is B (spawn point)
  phase1Answer: "B",

  // Phase 2: Origin Assertion - Answer is "spawn"
  phase2Answer: "spawn",

  // Phase 3A: Context question - Answer is B
  phase3AAnswer: "B",

  // Phase 3B: Byte question - Answer is "byte"
  phase3BAnswer: "byte",

  // Phase 3C: Base-2 question - Answer is A
  phase3CAnswer: "A",

  // ═══════════════════════════════════════════════════════════════
  // PHASE 4: WORLD LINK
  // ═══════════════════════════════════════════════════════════════

  // Link to download the Minecraft world (Google Drive, Dropbox, etc.)
  worldDownloadLink: "https://example.com/redstone-courier-world.zip",

  // The binding code visible at spawn in the Minecraft world
  // Player must find this in-game and enter it here
  bindingCode: "OBSIDIAN-FLUX-7742",

  // ═══════════════════════════════════════════════════════════════
  // PHASE 5: CODEX OF BITS
  // ═══════════════════════════════════════════════════════════════

  // Expected structure validation for the raw artifact
  phase5ExpectedLines: 8,        // Number of lines expected
  phase5ExpectedBitsPerLine: 8,  // Bits per line (1 byte per line)
  phase5TotalBits: 64,           // Total bit count

  // The decoded ASCII text from the binary artifact
  // Example: if artifact is ASCII for "REDSTONE", this would be "REDSTONE"
  phase5DecodedToken: "REDSTONE",

  // ═══════════════════════════════════════════════════════════════
  // PHASE 6: COORDINATE VERIFICATION
  // ═══════════════════════════════════════════════════════════════

  // Coordinates where the vault is located in the Minecraft world
  coordsX: 128,
  coordsY: 64,
  coordsZ: -256,

  // The vault key revealed upon successful coordinate entry
  // This is shown to the player as confirmation/lore
  vaultKey: "AMETHYST-PROTOCOL-ACTIVE",

  // ═══════════════════════════════════════════════════════════════
  // PHASE 7: THREE SHARDS
  // ═══════════════════════════════════════════════════════════════

  // Shard A: Binary encoded (prefix of tracking number)
  // Raw: 00110001 01011010 (binary for "1Z")
  shardADecoded: "1Z",

  // Shard B: Base64 encoded (core of tracking number)
  // Raw: MDlYNDNHMDM= (Base64 for "09X43G03")
  shardBDecoded: "09X43G03",

  // Shard C: Minecraft item counting (suffix of tracking number)
  // Raw: 8 chest slots with item counts: 0, 8, 1, 8, 6, 0, 0, 5
  shardCDecoded: "08186005",

  // ═══════════════════════════════════════════════════════════════
  // PHASE 8: FINAL ASSEMBLY
  // ═══════════════════════════════════════════════════════════════

  // The ordering rule answer (C = Prefix, Core, Suffix)
  phase8OrderingAnswer: "C",

  // Final tracking number (NEVER shown until decrypt animation completes)
  // UPS tracking: 1Z + 09X43G03 + 08186005
  trackingNumber: "1Z09X43G0308186005",

  // ═══════════════════════════════════════════════════════════════
  // ADMIN SETTINGS
  // ═══════════════════════════════════════════════════════════════

  // Key combination to open admin panel (hold these keys and click gear icon)
  // Default: Shift + Alt + Click on gear
  adminResetEnabled: true,

  // Local storage key prefix (change if running multiple instances)
  storagePrefix: "rcp_"
};

// Freeze config to prevent accidental modification at runtime
Object.freeze(CONFIG);
