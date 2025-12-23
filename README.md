# The Redstone Courier Protocol

A Minecraft-themed puzzle challenge website designed as a creative gift reveal experience. The recipient solves a series of cryptographic and logic puzzles to ultimately unlock a hidden tracking number.

## What Is This?

This is an interactive 6-phase decoding challenge wrapped in Minecraft terminal aesthetics. It was created as a Christmas gift experience where the recipient (Ezra) must prove their problem-solving skills to unlock a package tracking number.

The challenge combines:
- **Conceptual questions** about Minecraft mechanics
- **Binary and Base64 decoding** puzzles
- **A companion Minecraft world** with hidden clues
- **Progressive hint system** that reveals more help after failed attempts
- **Atmospheric design** with redstone, amethyst, and emerald color themes

## The Journey

### Phase 1-3: Foundation
The courier must demonstrate understanding of basic Minecraft concepts and binary/byte fundamentals before proceeding.

### Phase 4: World Link
A Minecraft world file contains a binding code at spawn that proves the connection between the digital challenge and physical delivery.

### Phase 5: Three Shards
Three encoded fragments are hidden throughout the Minecraft world:
- **The Mill** - Binary encoded shard
- **The Village Fountain** - Base64 encoded shard
- **The Castle Throne Room** - Crafter-counting encoded shard

Each location unlocks after solving the previous, creating a breadcrumb trail through the world.

### Phase 6: Final Assembly
With all three shards decoded, the courier must determine the correct assembly order to reconstruct the complete tracking number.

## Features

- **Persistent Progress** - Progress saves to browser localStorage
- **Tiered Hint System** - Three levels of hints, with the final tier revealing the answer as a safety net
- **Workbench Tools** - Utility tools unlock as you progress (byte grouper, Base64 reference, etc.)
- **Countdown Timer** - Visual urgency with color-coded status orb
- **Ambient Music** - Optional Minecraft-themed background music
- **Mobile Responsive** - Works on phones and tablets

## The End State

Upon completion, the tracking number is revealed through a dramatic decrypt animation. The final screen permanently displays the tracking number with a direct link to track the package, ensuring it's never lost.

## Credits

Created by Dak as a Christmas 2025 gift experience.

Built with vanilla HTML, CSS, and JavaScript. No frameworks, no build steps, no dependencies.
