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
  deadlineISO: "2025-12-27T13:00:00-07:00",

  // Operator identity
  operatorId: "Ezra",

  // Session key printed on the physical card
  sessionKey: "RCP-2025-XMAS-COURIER",

  // ═══════════════════════════════════════════════════════════════
  // PHASE 1-3: CONCEPTUAL QUESTIONS
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

  // Link to download the Minecraft world
  worldDownloadLink: "https://www.dropbox.com/scl/fi/6uehui8y35q8zd6b1tnno/TheRedstoneCourierProtocol.zip?rlkey=ms0phys19jvuq07er6hfx1mkm&st=u0bxtz3f&dl=1",

  // The binding code visible at spawn in the Minecraft world
  bindingCode: "OBSIDIAN-FLUX-7742",

  // ═══════════════════════════════════════════════════════════════
  // PHASE 5: THREE SHARDS
  // ═══════════════════════════════════════════════════════════════

  // Shard A: Binary encoded (prefix)
  // Raw: 00110001 01011010
  shardADecoded: "1Z",

  // Shard B: Base64 encoded (core)
  // Raw: MDlYNDNHMDM=
  shardBDecoded: "09X43G03",

  // Shard C: Item counting (suffix)
  // Raw: 8 chest slots with item counts: 0, 8, 1, 8, 6, 0, 0, 5
  shardCDecoded: "08186005",

  // ═══════════════════════════════════════════════════════════════
  // FINAL TRACKING NUMBER
  // ═══════════════════════════════════════════════════════════════

  // UPS tracking: 1Z + 09X43G03 + 08186005
  trackingNumber: "1Z09X43G0308186005",

  // ═══════════════════════════════════════════════════════════════
  // ADMIN SETTINGS
  // ═══════════════════════════════════════════════════════════════

  // Enable admin reset (Shift + Alt + Click gear icon)
  adminResetEnabled: true,

  // Local storage key prefix
  storagePrefix: "rcp_"
};

// Freeze config to prevent accidental modification at runtime
Object.freeze(CONFIG);
