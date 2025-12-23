/**
 * REDSTONE COURIER PROTOCOL - APPLICATION LOGIC
 * ==============================================
 * Complete single-page application for the decoding challenge.
 * Note: innerHTML is used for rendering trusted config data only.
 * User inputs are sanitized via textContent.
 */

// ═══════════════════════════════════════════════════════════════
// STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════

const STORAGE_KEY = CONFIG.storagePrefix + 'state';

const DEFAULT_STATE = {
  authenticated: false,
  currentPhase: 1,
  completedPhases: [],
  hintTiers: {
    login: 0,
    phase1: 0,
    phase2: 0,
    phase3A: 0,
    phase3B: 0,
    phase3C: 0,
    phase4: 0,
    phase5A: 0,
    phase5B: 0,
    phase5C: 0,
    phase6: 0
  },
  attempts: {},
  timestamps: {},
  missionLog: [],
  unlockedTools: [],
  phase3Checkpoints: { A: false, B: false, C: false },
  phase5Decoded: { A: '', B: '', C: '' },
  phase5Verified: { A: false, B: false, C: false },
  vaultKeyRevealed: false,
  decryptComplete: false
};

let state = loadState();

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_STATE, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to load state:', e);
  }
  return { ...DEFAULT_STATE };
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state:', e);
  }
}

function resetState() {
  state = { ...DEFAULT_STATE };
  saveState();
}

// ═══════════════════════════════════════════════════════════════
// TIMER UTILITIES
// ═══════════════════════════════════════════════════════════════

const deadline = new Date(CONFIG.deadlineISO).getTime();

function getTimeRemaining() {
  const now = Date.now();
  const diff = deadline - now;

  if (diff <= 0) {
    return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  return {
    expired: false,
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
    total: diff
  };
}

function formatTime(time) {
  if (time.expired) {
    return 'EXPIRED';
  }
  function pad(n) { return String(n).padStart(2, '0'); }
  return pad(time.days) + ':' + pad(time.hours) + ':' + pad(time.minutes) + ':' + pad(time.seconds);
}

function getOrbStatus(time) {
  if (time.expired) return 'black';
  const hoursLeft = time.total / (1000 * 60 * 60);
  if (hoursLeft > 48) return 'green';
  if (hoursLeft > 12) return 'gold';
  return 'red';
}

function updateTimers() {
  const time = getTimeRemaining();
  const formatted = formatTime(time);

  const loginTimer = document.getElementById('login-timer');
  const mainTimer = document.getElementById('main-timer');
  const statusOrb = document.getElementById('status-orb');

  if (loginTimer) loginTimer.textContent = formatted;
  if (mainTimer) {
    mainTimer.textContent = formatted;
    mainTimer.style.color = time.expired ? 'var(--redstone)' : '';
  }

  if (statusOrb) {
    statusOrb.className = 'status-orb ' + getOrbStatus(time);
  }

  if (time.expired && !document.body.classList.contains('expired')) {
    handleExpiry();
  }
}

function handleExpiry() {
  document.body.classList.add('expired');

  const banner = document.getElementById('expired-banner');
  const dashboard = document.getElementById('dashboard');
  const phaseContent = document.getElementById('phase-content');

  if (banner) banner.classList.remove('hidden');
  if (dashboard) dashboard.classList.add('expired');
  if (phaseContent) phaseContent.classList.add('readonly');

  addLogEntry('AUTHORIZATION WINDOW CLOSED', 'warning');
  renderPhaseContent();
}

// ═══════════════════════════════════════════════════════════════
// MISSION LOG
// ═══════════════════════════════════════════════════════════════

function addLogEntry(message, type) {
  type = type || 'system';
  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

  state.missionLog.unshift({ time: time, message: message, type: type });
  if (state.missionLog.length > 12) {
    state.missionLog = state.missionLog.slice(0, 12);
  }

  saveState();
  renderMissionLog();
}

function renderMissionLog() {
  const container = document.getElementById('mission-log');
  if (!container) return;

  container.textContent = '';
  state.missionLog.forEach(function(entry) {
    const div = document.createElement('div');
    div.className = 'log-entry ' + entry.type;
    const timeSpan = document.createElement('span');
    timeSpan.className = 'log-time';
    timeSpan.textContent = '[' + entry.time + '] ';
    div.appendChild(timeSpan);
    div.appendChild(document.createTextNode(entry.message));
    container.appendChild(div);
  });
}

// ═══════════════════════════════════════════════════════════════
// HINT SYSTEM
// ═══════════════════════════════════════════════════════════════

const HINTS = {
  login: [
    'Operator ID must match whitelist.',
    'Operator ID is printed on the card.',
    'Operator ID: ' + CONFIG.operatorId + '. Session Key: ' + CONFIG.sessionKey
  ],
  phase1: [
    'It is not something you craft or find.',
    'It is where your first step begins.',
    'Choose option B.'
  ],
  phase2: [
    'Minecraft uses this word constantly.',
    'It is where you appear.',
    'Type: spawn'
  ],
  phase3A: [
    'Not physical.',
    'Interprets the value.',
    'Choose B.'
  ],
  phase3B: [
    'Small chunk.',
    'Eight bits.',
    'Type: byte'
  ],
  phase3C: [
    'Two symbols.',
    '0 and 1.',
    'Choose A.'
  ],
  phase4: [
    'It is visible at spawn.',
    'It is labeled BINDING CODE.',
    'Enter exactly: ' + CONFIG.bindingCode
  ],
  phase5A: [
    'Two symbols.',
    'Binary to digits.',
    'Decoded shard A must be: ' + CONFIG.shardADecoded
  ],
  phase5B: [
    'Too clean to be natural.',
    'Moves data safely through systems.',
    'This is Base64. Decoded shard B must be: ' + CONFIG.shardBDecoded
  ],
  phase5C: [
    'Count like a crafter.',
    'Grouping and stacks matter.',
    'Decoded shard C must be: ' + CONFIG.shardCDecoded
  ],
  phase6: [
    'It is not random.',
    'One shard clearly belongs at the start.',
    'Choose option C.'
  ]
};

function getHint(key) {
  const tier = state.hintTiers[key] || 0;
  const hints = HINTS[key] || [];

  if (tier < hints.length) {
    state.hintTiers[key] = tier + 1;
    saveState();
    addLogEntry('Hint Tier ' + (tier + 1) + ' issued', 'hint');
    return { tier: tier + 1, text: hints[tier] };
  }

  return null;
}

function renderHints(containerId, key) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const tier = state.hintTiers[key] || 0;
  const hints = HINTS[key] || [];

  container.textContent = '';
  hints.slice(0, tier).forEach(function(hint, i) {
    const div = document.createElement('div');
    div.className = 'hint-item';
    const tierSpan = document.createElement('span');
    tierSpan.className = 'hint-tier';
    tierSpan.textContent = 'TIER ' + (i + 1) + ': ';
    div.appendChild(tierSpan);
    div.appendChild(document.createTextNode(hint));
    container.appendChild(div);
  });
}

// ═══════════════════════════════════════════════════════════════
// WORKBENCH TOOLS
// ═══════════════════════════════════════════════════════════════

const TOOLS = [
  { id: 'byte-grouper', name: 'Byte Grouper', unlockPhase: 3, icon: '[]', desc: 'Format binary into 8-bit groups' },
  { id: 'integrity-check', name: 'Artifact Integrity', unlockPhase: 4, icon: '?!', desc: 'Validate binary structure' },
  { id: 'base-reference', name: 'Base Reference', unlockPhase: 4, icon: '#', desc: 'Number base cheat sheet' },
  { id: 'symbol-counter', name: 'Symbol Counter', unlockPhase: 5, icon: '+', desc: 'Character frequency analysis' }
];

function isToolUnlocked(toolId) {
  return state.unlockedTools.includes(toolId);
}

function unlockTool(toolId) {
  if (!state.unlockedTools.includes(toolId)) {
    state.unlockedTools.push(toolId);
    saveState();
    const tool = TOOLS.find(function(t) { return t.id === toolId; });
    if (tool) {
      addLogEntry('Tool unlocked: ' + tool.name, 'success');
      showToolUnlockNotification(tool);
    }
  }
}

function showToolUnlockNotification(tool) {
  // Remove any existing notification
  const existing = document.querySelector('.tool-notification');
  if (existing) existing.remove();

  const notification = document.createElement('div');
  notification.className = 'tool-notification';

  const icon = document.createElement('div');
  icon.className = 'tool-notification-icon';
  icon.textContent = tool.icon;
  notification.appendChild(icon);

  const content = document.createElement('div');
  content.className = 'tool-notification-content';

  const title = document.createElement('div');
  title.className = 'tool-notification-title';
  title.textContent = 'TOOL UNLOCKED';
  content.appendChild(title);

  const name = document.createElement('div');
  name.className = 'tool-notification-name';
  name.textContent = tool.name;
  content.appendChild(name);

  const desc = document.createElement('div');
  desc.className = 'tool-notification-desc';
  desc.textContent = tool.desc || 'Available in Workbench Tools';
  content.appendChild(desc);

  notification.appendChild(content);
  document.body.appendChild(notification);

  // Trigger animation
  setTimeout(function() {
    notification.classList.add('show');
  }, 100);

  // Auto-hide after 4 seconds
  setTimeout(function() {
    notification.classList.remove('show');
    setTimeout(function() {
      notification.remove();
    }, 500);
  }, 4000);
}

function renderWorkbenchTools() {
  const container = document.getElementById('workbench-tools');
  if (!container) return;

  container.textContent = '';
  TOOLS.forEach(function(tool) {
    const unlocked = isToolUnlocked(tool.id);
    const div = document.createElement('div');
    div.className = 'tool-item' + (unlocked ? '' : ' locked');
    div.title = unlocked ? 'Open tool' : 'Locked';
    if (unlocked) {
      div.onclick = function() { openTool(tool.id); };
    }

    const iconSpan = document.createElement('span');
    iconSpan.className = 'tool-icon';
    iconSpan.textContent = tool.icon;
    div.appendChild(iconSpan);

    const labelSpan = document.createElement('span');
    labelSpan.className = 'tool-label';
    labelSpan.textContent = tool.name;
    div.appendChild(labelSpan);

    if (!unlocked) {
      const unlockSpan = document.createElement('span');
      unlockSpan.className = 'tool-unlock';
      unlockSpan.textContent = 'P' + tool.unlockPhase;
      div.appendChild(unlockSpan);
    }

    container.appendChild(div);
  });
}

function openTool(toolId) {
  const modal = document.getElementById('tool-modal');
  const title = document.getElementById('tool-modal-title');
  const body = document.getElementById('tool-modal-body');

  const tool = TOOLS.find(function(t) { return t.id === toolId; });
  if (!tool || !modal || !title || !body) return;

  title.textContent = tool.name.toUpperCase();
  renderToolContent(body, toolId);
  modal.classList.remove('hidden');
}

function closeToolModal() {
  const modal = document.getElementById('tool-modal');
  if (modal) modal.classList.add('hidden');
}

function renderToolContent(container, toolId) {
  container.textContent = '';

  switch (toolId) {
    case 'byte-grouper':
      renderByteGrouperTool(container);
      break;
    case 'integrity-check':
      renderIntegrityCheckTool(container);
      break;
    case 'base-reference':
      renderBaseReferenceTool(container);
      break;
    case 'symbol-counter':
      renderSymbolCounterTool(container);
      break;
    default:
      container.textContent = 'Tool not found.';
  }
}

function renderByteGrouperTool(container) {
  const desc = document.createElement('p');
  desc.className = 'tool-description';
  desc.textContent = 'Paste binary data to format into 8-bit groups.';
  container.appendChild(desc);

  const inputGroup = document.createElement('div');
  inputGroup.className = 'input-group';
  const label = document.createElement('label');
  label.textContent = 'INPUT BINARY';
  inputGroup.appendChild(label);
  const textarea = document.createElement('textarea');
  textarea.id = 'tool-input';
  textarea.placeholder = 'Paste binary here...';
  textarea.oninput = runByteGrouper;
  inputGroup.appendChild(textarea);
  container.appendChild(inputGroup);

  const output = document.createElement('div');
  output.className = 'tool-output';
  output.id = 'tool-result';
  output.textContent = 'Waiting for input...';
  container.appendChild(output);

  const stats = document.createElement('div');
  stats.className = 'tool-stats';
  stats.id = 'tool-stats';
  container.appendChild(stats);
}

function renderIntegrityCheckTool(container) {
  const desc = document.createElement('p');
  desc.className = 'tool-description';
  desc.textContent = 'Validate artifact structure. Checks for valid characters and structure.';
  container.appendChild(desc);

  const inputGroup = document.createElement('div');
  inputGroup.className = 'input-group';
  const label = document.createElement('label');
  label.textContent = 'ARTIFACT DATA';
  inputGroup.appendChild(label);
  const textarea = document.createElement('textarea');
  textarea.id = 'tool-input';
  textarea.placeholder = 'Paste artifact here...';
  textarea.oninput = runIntegrityCheck;
  inputGroup.appendChild(textarea);
  container.appendChild(inputGroup);

  const output = document.createElement('div');
  output.className = 'tool-output';
  output.id = 'tool-result';
  output.textContent = 'Waiting for input...';
  container.appendChild(output);

  const stats = document.createElement('div');
  stats.className = 'tool-stats';
  stats.id = 'tool-stats';
  container.appendChild(stats);
}

function renderBaseReferenceTool(container) {
  const desc = document.createElement('p');
  desc.className = 'tool-description';
  desc.textContent = 'Quick reference for number bases used in encoding.';
  container.appendChild(desc);

  const table = document.createElement('table');
  table.className = 'reference-table';
  
  const headerRow = document.createElement('tr');
  ['Base', 'Name', 'Digits', 'Example'].forEach(function(h) {
    const th = document.createElement('th');
    th.textContent = h;
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);

  const data = [
    ['Base-2', 'Binary', '0, 1', "01000001 = 65 = 'A'"],
    ['Base-10', 'Decimal', '0-9', "65 = 'A' in ASCII"],
    ['Base-16', 'Hexadecimal', '0-9, A-F', "41 = 65 = 'A'"],
    ['Base-64', 'Base64', 'A-Z, a-z, 0-9, +, /', "QQ== = 'A'"]
  ];

  data.forEach(function(row) {
    const tr = document.createElement('tr');
    row.forEach(function(cell) {
      const td = document.createElement('td');
      td.textContent = cell;
      tr.appendChild(td);
    });
    table.appendChild(tr);
  });

  container.appendChild(table);

  const note = document.createElement('div');
  note.style.marginTop = 'var(--spacing-md)';
  note.style.fontSize = '0.8rem';
  note.style.color = 'var(--text-secondary)';
  
  const b1 = document.createElement('strong');
  b1.textContent = 'ASCII: ';
  note.appendChild(b1);
  note.appendChild(document.createTextNode('Each byte (8 bits) represents one character.'));
  note.appendChild(document.createElement('br'));
  const b2 = document.createElement('strong');
  b2.textContent = 'Binary to ASCII: ';
  note.appendChild(b2);
  note.appendChild(document.createTextNode('Group bits into 8, convert each group to decimal, then to character.'));
  container.appendChild(note);
}

function renderSymbolCounterTool(container) {
  const desc = document.createElement('p');
  desc.className = 'tool-description';
  desc.textContent = 'Count characters and identify patterns in encoded data.';
  container.appendChild(desc);

  const inputGroup = document.createElement('div');
  inputGroup.className = 'input-group';
  const label = document.createElement('label');
  label.textContent = 'INPUT DATA';
  inputGroup.appendChild(label);
  const textarea = document.createElement('textarea');
  textarea.id = 'tool-input';
  textarea.placeholder = 'Paste data here...';
  textarea.oninput = runSymbolCounter;
  inputGroup.appendChild(textarea);
  container.appendChild(inputGroup);

  const output = document.createElement('div');
  output.className = 'tool-output';
  output.id = 'tool-result';
  output.textContent = 'Waiting for input...';
  container.appendChild(output);

  const stats = document.createElement('div');
  stats.className = 'tool-stats';
  stats.id = 'tool-stats';
  container.appendChild(stats);
}

function runByteGrouper() {
  const input = document.getElementById('tool-input');
  const result = document.getElementById('tool-result');
  const stats = document.getElementById('tool-stats');
  if (!input || !result || !stats) return;

  const binary = input.value.replace(/[^01]/g, '');
  const groups = [];
  for (var i = 0; i < binary.length; i += 8) {
    groups.push(binary.slice(i, i + 8));
  }

  var formatted = groups.join(' ');
  var incomplete = binary.length % 8;

  result.textContent = formatted || 'No binary data found.';
  
  stats.textContent = '';
  addToolStat(stats, 'Total bits', binary.length);
  addToolStat(stats, 'Complete bytes', groups.filter(function(g) { return g.length === 8; }).length);
  if (incomplete) {
    addToolStat(stats, 'Incomplete', incomplete + ' bits');
  }
}

function runIntegrityCheck() {
  const input = document.getElementById('tool-input');
  const result = document.getElementById('tool-result');
  const stats = document.getElementById('tool-stats');
  if (!input || !result || !stats) return;

  const value = input.value;
  const validChars = value.replace(/[01\s\n]/g, '');
  const isValid = validChars.length === 0 && value.trim().length > 0;

  const lines = value.split('\n').filter(function(l) { return l.trim(); });
  const binaryOnly = value.replace(/[^01]/g, '');
  const zeros = (value.match(/0/g) || []).length;
  const ones = (value.match(/1/g) || []).length;

  if (!value.trim()) {
    result.textContent = 'No data provided.';
    result.style.color = '';
  } else if (isValid) {
    result.textContent = 'INTEGRITY CHECK: PASSED\nStructure valid. Only binary characters detected.';
    result.style.color = 'var(--emerald)';
  } else {
    var preview = validChars.slice(0, 20) + (validChars.length > 20 ? '...' : '');
    result.textContent = 'INTEGRITY CHECK: FAILED\nInvalid characters detected: "' + preview + '"';
    result.style.color = 'var(--error)';
  }

  stats.textContent = '';
  addToolStat(stats, 'Lines', lines.length);
  addToolStat(stats, 'Total bits', binaryOnly.length);
  addToolStat(stats, '0s', zeros);
  addToolStat(stats, '1s', ones);
}

function runSymbolCounter() {
  const input = document.getElementById('tool-input');
  const result = document.getElementById('tool-result');
  const stats = document.getElementById('tool-stats');
  if (!input || !result || !stats) return;

  const value = input.value;
  const counts = {};
  for (var i = 0; i < value.length; i++) {
    var char = value[i];
    if (char !== '\n' && char !== '\r') {
      counts[char] = (counts[char] || 0) + 1;
    }
  }

  var sorted = Object.entries(counts)
    .sort(function(a, b) { return b[1] - a[1]; })
    .slice(0, 15);

  if (sorted.length === 0) {
    result.textContent = 'No data provided.';
  } else {
    result.textContent = sorted
      .map(function(item) { return "'" + (item[0] === ' ' ? 'SPACE' : item[0]) + "': " + item[1]; })
      .join('\n');
  }

  stats.textContent = '';
  addToolStat(stats, 'Total chars', value.replace(/[\n\r]/g, '').length);
  addToolStat(stats, 'Unique', Object.keys(counts).length);
}

function addToolStat(container, label, value) {
  const div = document.createElement('div');
  div.className = 'tool-stat';
  const labelSpan = document.createElement('span');
  labelSpan.className = 'tool-stat-label';
  labelSpan.textContent = label + ':';
  div.appendChild(labelSpan);
  const valueSpan = document.createElement('span');
  valueSpan.className = 'tool-stat-value';
  valueSpan.textContent = value;
  div.appendChild(valueSpan);
  container.appendChild(div);
}

// ═══════════════════════════════════════════════════════════════
// PHASE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

const PHASES = [
  {
    id: 1,
    name: 'WHITELIST PROTOCOL',
    briefing: 'Before a courier can operate, they must prove they understand the foundational principles of the realm. This is not a test of skill, but of awareness.',
    objective: 'In every Minecraft world, there is a concept that exists even before you move. The system anchors everything to it. What is it?'
  },
  {
    id: 2,
    name: 'ORIGIN ASSERTION',
    briefing: 'Every world has a center. A point from which all journeys begin. Without naming coordinates, the system recognizes this place by a universal term.',
    objective: 'Name the place every world agrees on, even when terrain is chaos.'
  },
  {
    id: 3,
    name: 'LANGUAGE OF MACHINES',
    briefing: 'The courier network speaks in a language older than words. To decode the final payload, you must first understand how machines think.',
    objective: 'Complete all three checkpoints to prove fluency in the machine tongue.'
  },
  {
    id: 4,
    name: 'WORLD LINK ESTABLISHED',
    briefing: 'A physical artifact has been prepared. Within a Minecraft world, at spawn, a binding code awaits. This code proves your connection to the physical delivery.',
    objective: 'Download the world file, locate the binding code at spawn, and return it here.'
  },
  {
    id: 5,
    name: 'THREE SHARDS',
    briefing: 'The tracking number is fragmented across three shards hidden in the world. Each encoded differently: binary, Base64, and crafter counting. Follow the path to find them all.',
    objective: 'Explore the world, find each shard location, decode all three shards to reconstruct the courier identifier.'
  },
  {
    id: 6,
    name: 'COURIER VISION',
    briefing: 'You have all three shards. The throne room marked the assembly order. Only the correct sequence will unlock the final transmission.',
    objective: 'Assemble the shards in the correct order and select the ordering rule.'
  }
];

// ═══════════════════════════════════════════════════════════════
// PHASE RENDERING
// ═══════════════════════════════════════════════════════════════

function renderPhaseNav() {
  const nav = document.getElementById('phase-nav');
  if (!nav) return;

  nav.textContent = '';
  PHASES.forEach(function(phase) {
    const isCompleted = state.completedPhases.includes(phase.id);
    const isCurrent = state.currentPhase === phase.id;
    const isLocked = phase.id > state.currentPhase && !isCompleted;

    var statusClass = 'locked';
    var iconText = '\u{1F512}';
    var iconClass = 'lock';

    if (isCompleted) {
      statusClass = 'completed';
      iconText = '\u2713';
      iconClass = 'check';
    } else if (isCurrent) {
      statusClass = 'active';
      iconText = '\u25B6';
      iconClass = 'active';
    }

    const div = document.createElement('div');
    div.className = 'phase-item ' + statusClass;
    div.dataset.phase = phase.id;
    if (isCompleted || isCurrent) {
      div.onclick = function() { viewPhase(phase.id); };
      div.style.cursor = 'pointer';
    }

    const iconSpan = document.createElement('span');
    iconSpan.className = 'phase-icon ' + iconClass;
    iconSpan.textContent = iconText;
    div.appendChild(iconSpan);

    const labelSpan = document.createElement('span');
    labelSpan.className = 'phase-label';
    labelSpan.textContent = phase.id + '. ' + phase.name;
    div.appendChild(labelSpan);

    nav.appendChild(div);
  });
}

function viewPhase(phaseId) {
  if (phaseId <= state.currentPhase || state.completedPhases.includes(phaseId)) {
    renderPhaseContent(phaseId);
  }
}

function renderPhaseContent(overridePhase) {
  const container = document.getElementById('phase-content');
  if (!container) return;

  const phaseId = overridePhase || state.currentPhase;
  const phase = PHASES.find(function(p) { return p.id === phaseId; });
  if (!phase) return;

  const isCompleted = state.completedPhases.includes(phaseId);
  const isExpired = getTimeRemaining().expired;
  const isReadOnly = isCompleted || isExpired;

  if (isExpired) {
    container.classList.add('readonly');
  } else {
    container.classList.remove('readonly');
  }

  container.textContent = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'phase-container';

  // Header
  const header = document.createElement('div');
  header.className = 'phase-header';

  const phaseNum = document.createElement('div');
  phaseNum.className = 'phase-number';
  phaseNum.textContent = 'PHASE ' + phase.id + ' OF 8';
  if (isCompleted) {
    const badge = document.createElement('span');
    badge.className = 'readonly-badge';
    badge.textContent = 'COMPLETED';
    phaseNum.appendChild(badge);
  }
  header.appendChild(phaseNum);

  const title = document.createElement('h2');
  title.className = 'phase-title';
  title.textContent = phase.name;
  header.appendChild(title);
  wrapper.appendChild(header);

  // Briefing
  const briefing = document.createElement('div');
  briefing.className = 'phase-briefing';
  const briefingLabel = document.createElement('div');
  briefingLabel.className = 'briefing-label';
  briefingLabel.textContent = 'BRIEFING';
  briefing.appendChild(briefingLabel);
  const briefingText = document.createElement('p');
  briefingText.className = 'briefing-text';
  briefingText.textContent = phase.briefing;
  briefing.appendChild(briefingText);
  wrapper.appendChild(briefing);

  // Objective
  const objective = document.createElement('div');
  objective.className = 'phase-objective';
  const objectiveLabel = document.createElement('div');
  objectiveLabel.className = 'objective-label';
  objectiveLabel.textContent = 'OBJECTIVE';
  objective.appendChild(objectiveLabel);
  const objectiveText = document.createElement('p');
  objectiveText.className = 'objective-text';
  objectiveText.textContent = phase.objective;
  objective.appendChild(objectiveText);
  wrapper.appendChild(objective);

  // Form
  const form = document.createElement('div');
  form.className = 'phase-form';

  switch (phaseId) {
    case 1: renderPhase1Form(form, isReadOnly); break;
    case 2: renderPhase2Form(form, isReadOnly); break;
    case 3: renderPhase3Form(form, isReadOnly); break;
    case 4: renderPhase4Form(form, isReadOnly); break;
    case 5: renderPhase5Form(form, isReadOnly); break;
    case 6: renderPhase6Form(form, isReadOnly); break;
  }

  wrapper.appendChild(form);
  container.appendChild(wrapper);
}

// Helper functions for form building
function createChoiceGroup(id, options, isReadOnly, onSelect) {
  const group = document.createElement('div');
  group.className = 'choice-group';
  group.id = id + '-choices';

  options.forEach(function(opt) {
    const label = document.createElement('label');
    label.className = 'choice-option' + (isReadOnly ? ' disabled' : '');
    
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = id;
    radio.value = opt.letter;
    radio.disabled = isReadOnly;
    
    if (!isReadOnly) {
      label.onclick = function() {
        group.querySelectorAll('.choice-option').forEach(function(o) { o.classList.remove('selected'); });
        group.querySelectorAll('input').forEach(function(i) { i.checked = false; });
        label.classList.add('selected');
        radio.checked = true;
        if (onSelect) onSelect(opt.letter);
      };
    }
    
    label.appendChild(radio);

    const choiceLabel = document.createElement('span');
    choiceLabel.className = 'choice-label';
    const letterSpan = document.createElement('span');
    letterSpan.className = 'choice-letter';
    letterSpan.textContent = opt.letter + ') ';
    choiceLabel.appendChild(letterSpan);
    choiceLabel.appendChild(document.createTextNode(opt.text));
    label.appendChild(choiceLabel);

    group.appendChild(label);
  });

  return group;
}

function getSelectedChoice(prefix) {
  const container = document.getElementById(prefix + '-choices');
  if (!container) return null;
  const selected = container.querySelector('input[type="radio"]:checked');
  return selected ? selected.value : null;
}

function createSubmitButton(text, onClick, isReadOnly, extraClass) {
  const btn = document.createElement('button');
  btn.className = 'submit-btn' + (extraClass ? ' ' + extraClass : '');
  btn.textContent = text;
  btn.disabled = isReadOnly;
  btn.onclick = onClick;
  return btn;
}

function createResponseDiv(id) {
  const div = document.createElement('div');
  div.id = id;
  div.className = 'system-response';
  return div;
}

function createHintsDiv(id) {
  const div = document.createElement('div');
  div.id = id;
  div.className = 'hint-stack';
  return div;
}

function createInputGroup(labelText, inputId, placeholder, isReadOnly, isTextarea) {
  const group = document.createElement('div');
  group.className = 'input-group';

  const label = document.createElement('label');
  label.textContent = labelText;
  group.appendChild(label);

  const input = document.createElement(isTextarea ? 'textarea' : 'input');
  input.id = inputId;
  input.placeholder = placeholder;
  input.disabled = isReadOnly;
  if (isTextarea) {
    input.style.minHeight = '100px';
  }
  group.appendChild(input);

  return group;
}

// Phase 1: Multiple Choice
function renderPhase1Form(container, isReadOnly) {
  const options = [
    { letter: 'A', text: 'The strongest block' },
    { letter: 'B', text: 'The spawn point' },
    { letter: 'C', text: 'The rarest biome' },
    { letter: 'D', text: 'The End portal' }
  ];

  container.appendChild(createChoiceGroup('phase1', options, isReadOnly));
  container.appendChild(createSubmitButton('SUBMIT RESPONSE', submitPhase1, isReadOnly));
  container.appendChild(createResponseDiv('phase1-response'));
  container.appendChild(createHintsDiv('phase1-hints'));
  renderHints('phase1-hints', 'phase1');
}

function submitPhase1() {
  const answer = getSelectedChoice('phase1');
  const responseEl = document.getElementById('phase1-response');

  if (!answer) {
    responseEl.textContent = 'No selection made.';
    responseEl.className = 'system-response warning';
    return;
  }

  addLogEntry('Phase 1 attempt: ' + answer, 'attempt');

  if (answer.toUpperCase() === CONFIG.phase1Answer.toUpperCase()) {
    responseEl.textContent = 'ACCEPTED. Whitelist protocol confirmed.';
    responseEl.className = 'system-response success';
    completePhase(1);
  } else {
    responseEl.textContent = 'REJECTED. Selection does not match expected value.';
    responseEl.className = 'system-response error';
    getHint('phase1');
    renderHints('phase1-hints', 'phase1');
  }
}

// Phase 2: Text Input
function renderPhase2Form(container, isReadOnly) {
  container.appendChild(createInputGroup('YOUR ANSWER', 'phase2-input', 'Enter the universal term...', isReadOnly));
  container.appendChild(createSubmitButton('SUBMIT RESPONSE', submitPhase2, isReadOnly));
  container.appendChild(createResponseDiv('phase2-response'));
  container.appendChild(createHintsDiv('phase2-hints'));
  renderHints('phase2-hints', 'phase2');
}

function submitPhase2() {
  const input = document.getElementById('phase2-input');
  const responseEl = document.getElementById('phase2-response');
  const answer = (input ? input.value : '').trim().toLowerCase();

  if (!answer) {
    responseEl.textContent = 'No input provided.';
    responseEl.className = 'system-response warning';
    return;
  }

  addLogEntry('Phase 2 attempt', 'attempt');

  if (answer === CONFIG.phase2Answer.toLowerCase()) {
    responseEl.textContent = 'ACCEPTED. Origin assertion verified.';
    responseEl.className = 'system-response success';
    completePhase(2);
  } else {
    responseEl.textContent = 'REJECTED. Term does not match system records.';
    responseEl.className = 'system-response error';
    getHint('phase2');
    renderHints('phase2-hints', 'phase2');
  }
}

// Phase 3: Three Checkpoints
function renderPhase3Form(container, isReadOnly) {
  const checkA = state.phase3Checkpoints.A;
  const checkB = state.phase3Checkpoints.B;
  const checkC = state.phase3Checkpoints.C;

  // Checkpoint 3A
  const check3A = document.createElement('div');
  check3A.className = 'checkpoint-container';

  const header3A = document.createElement('div');
  header3A.className = 'checkpoint-header';
  header3A.textContent = 'CHECKPOINT 3A ';
  const status3A = document.createElement('span');
  status3A.className = 'checkpoint-status ' + (checkA ? 'complete' : 'pending');
  status3A.textContent = checkA ? 'COMPLETE' : 'PENDING';
  header3A.appendChild(status3A);
  check3A.appendChild(header3A);

  const q3A = document.createElement('p');
  q3A.className = 'objective-text';
  q3A.style.marginBottom = 'var(--spacing-md)';
  q3A.textContent = 'A number can be correct and still meaningless. What gives it meaning?';
  check3A.appendChild(q3A);

  const options3A = [
    { letter: 'A', text: 'Volume' },
    { letter: 'B', text: 'Context' },
    { letter: 'C', text: 'Luck' },
    { letter: 'D', text: 'Rarity' }
  ];
  check3A.appendChild(createChoiceGroup('phase3A', options3A, isReadOnly || checkA));

  if (!checkA) {
    check3A.appendChild(createSubmitButton('VERIFY 3A', submitPhase3A, isReadOnly));
  }
  check3A.appendChild(createResponseDiv('phase3A-response'));
  check3A.appendChild(createHintsDiv('phase3A-hints'));
  container.appendChild(check3A);

  // Checkpoint 3B
  const check3B = document.createElement('div');
  check3B.className = 'checkpoint-container';

  const header3B = document.createElement('div');
  header3B.className = 'checkpoint-header';
  header3B.textContent = 'CHECKPOINT 3B ';
  const status3B = document.createElement('span');
  status3B.className = 'checkpoint-status ' + (checkB ? 'complete' : 'pending');
  status3B.textContent = checkB ? 'COMPLETE' : 'PENDING';
  header3B.appendChild(status3B);
  check3B.appendChild(header3B);

  const q3B = document.createElement('p');
  q3B.className = 'objective-text';
  q3B.style.marginBottom = 'var(--spacing-md)';
  q3B.textContent = 'I speak in eights. I become letters. What am I?';
  check3B.appendChild(q3B);

  check3B.appendChild(createInputGroup('YOUR ANSWER', 'phase3B-input', 'Enter the term...', isReadOnly || checkB));

  if (!checkB) {
    check3B.appendChild(createSubmitButton('VERIFY 3B', submitPhase3B, isReadOnly));
  }
  check3B.appendChild(createResponseDiv('phase3B-response'));
  check3B.appendChild(createHintsDiv('phase3B-hints'));
  container.appendChild(check3B);

  // Checkpoint 3C
  const check3C = document.createElement('div');
  check3C.className = 'checkpoint-container';

  const header3C = document.createElement('div');
  header3C.className = 'checkpoint-header';
  header3C.textContent = 'CHECKPOINT 3C ';
  const status3C = document.createElement('span');
  status3C.className = 'checkpoint-status ' + (checkC ? 'complete' : 'pending');
  status3C.textContent = checkC ? 'COMPLETE' : 'PENDING';
  header3C.appendChild(status3C);
  check3C.appendChild(header3C);

  const q3C = document.createElement('p');
  q3C.className = 'objective-text';
  q3C.style.marginBottom = 'var(--spacing-md)';
  q3C.textContent = 'The redstone alphabet has two symbols. Which base is it?';
  check3C.appendChild(q3C);

  const options3C = [
    { letter: 'A', text: 'Base-2' },
    { letter: 'B', text: 'Base-8' },
    { letter: 'C', text: 'Base-10' },
    { letter: 'D', text: 'Base-16' }
  ];
  check3C.appendChild(createChoiceGroup('phase3C', options3C, isReadOnly || checkC));

  if (!checkC) {
    check3C.appendChild(createSubmitButton('VERIFY 3C', submitPhase3C, isReadOnly));
  }
  check3C.appendChild(createResponseDiv('phase3C-response'));
  check3C.appendChild(createHintsDiv('phase3C-hints'));
  container.appendChild(check3C);

  // Render existing hints
  renderHints('phase3A-hints', 'phase3A');
  renderHints('phase3B-hints', 'phase3B');
  renderHints('phase3C-hints', 'phase3C');
}

function submitPhase3A() {
  const answer = getSelectedChoice('phase3A');
  const responseEl = document.getElementById('phase3A-response');

  if (!answer) {
    responseEl.textContent = 'No selection made.';
    responseEl.className = 'system-response warning';
    return;
  }

  addLogEntry('Checkpoint 3A attempt', 'attempt');

  if (answer.toUpperCase() === CONFIG.phase3AAnswer.toUpperCase()) {
    responseEl.textContent = 'ACCEPTED. Checkpoint 3A verified.';
    responseEl.className = 'system-response success';
    state.phase3Checkpoints.A = true;
    saveState();
    checkPhase3Complete();
    renderPhaseContent();
  } else {
    responseEl.textContent = 'REJECTED. Incorrect interpretation.';
    responseEl.className = 'system-response error';
    getHint('phase3A');
    renderHints('phase3A-hints', 'phase3A');
  }
}

function submitPhase3B() {
  const input = document.getElementById('phase3B-input');
  const responseEl = document.getElementById('phase3B-response');
  const answer = (input ? input.value : '').trim().toLowerCase();

  if (!answer) {
    responseEl.textContent = 'No input provided.';
    responseEl.className = 'system-response warning';
    return;
  }

  addLogEntry('Checkpoint 3B attempt', 'attempt');

  if (answer === CONFIG.phase3BAnswer.toLowerCase()) {
    responseEl.textContent = 'ACCEPTED. Checkpoint 3B verified.';
    responseEl.className = 'system-response success';
    state.phase3Checkpoints.B = true;
    saveState();
    checkPhase3Complete();
    renderPhaseContent();
  } else {
    responseEl.textContent = 'REJECTED. Term unrecognized.';
    responseEl.className = 'system-response error';
    getHint('phase3B');
    renderHints('phase3B-hints', 'phase3B');
  }
}

function submitPhase3C() {
  const answer = getSelectedChoice('phase3C');
  const responseEl = document.getElementById('phase3C-response');

  if (!answer) {
    responseEl.textContent = 'No selection made.';
    responseEl.className = 'system-response warning';
    return;
  }

  addLogEntry('Checkpoint 3C attempt', 'attempt');

  if (answer.toUpperCase() === CONFIG.phase3CAnswer.toUpperCase()) {
    responseEl.textContent = 'ACCEPTED. Checkpoint 3C verified.';
    responseEl.className = 'system-response success';
    state.phase3Checkpoints.C = true;
    saveState();
    checkPhase3Complete();
    renderPhaseContent();
  } else {
    responseEl.textContent = 'REJECTED. Base mismatch.';
    responseEl.className = 'system-response error';
    getHint('phase3C');
    renderHints('phase3C-hints', 'phase3C');
  }
}

function checkPhase3Complete() {
  if (state.phase3Checkpoints.A && state.phase3Checkpoints.B && state.phase3Checkpoints.C) {
    completePhase(3);
    unlockTool('byte-grouper');
  }
}

// Phase 4: Binding Code
function renderPhase4Form(container, isReadOnly) {
  const downloadSection = document.createElement('div');
  downloadSection.className = 'download-section';

  const downloadLabel = document.createElement('div');
  downloadLabel.className = 'download-label';
  downloadLabel.textContent = 'WORLD FILE';
  downloadSection.appendChild(downloadLabel);

  const downloadLink = document.createElement('a');
  downloadLink.href = CONFIG.worldDownloadLink;
  downloadLink.target = '_blank';
  downloadLink.className = 'download-link';
  const icon = document.createElement('span');
  icon.textContent = '\u2B07';
  downloadLink.appendChild(icon);
  downloadLink.appendChild(document.createTextNode(' DOWNLOAD MINECRAFT WORLD'));
  downloadSection.appendChild(downloadLink);

  container.appendChild(downloadSection);
  container.appendChild(createInputGroup('BINDING CODE', 'phase4-input', 'Enter the binding code from spawn...', isReadOnly));
  container.appendChild(createSubmitButton('VERIFY BINDING', submitPhase4, isReadOnly));
  container.appendChild(createResponseDiv('phase4-response'));
  container.appendChild(createHintsDiv('phase4-hints'));
  renderHints('phase4-hints', 'phase4');
}

function submitPhase4() {
  const input = document.getElementById('phase4-input');
  const responseEl = document.getElementById('phase4-response');
  const answer = (input ? input.value : '').trim().toUpperCase();

  if (!answer) {
    responseEl.textContent = 'No binding code provided.';
    responseEl.className = 'system-response warning';
    return;
  }

  addLogEntry('Phase 4 binding verification', 'attempt');

  if (answer === CONFIG.bindingCode.toUpperCase()) {
    responseEl.textContent = 'ACCEPTED. World link established. Physical artifact confirmed.';
    responseEl.className = 'system-response success';
    completePhase(4);
    unlockTool('integrity-check');
  } else {
    responseEl.textContent = 'REJECTED. Binding code does not match registered artifact.';
    responseEl.className = 'system-response error';
    getHint('phase4');
    renderHints('phase4-hints', 'phase4');
  }
}

// Phase 5: Three Shards
function renderPhase5Form(container, isReadOnly) {
  // Check which shards are already verified
  const shardAVerified = state.phase5Verified && state.phase5Verified.A;
  const shardBVerified = state.phase5Verified && state.phase5Verified.B;
  const shardCVerified = state.phase5Verified && state.phase5Verified.C;

  // Instructions
  const instructions = document.createElement('div');
  instructions.className = 'phase-briefing';
  instructions.style.marginBottom = 'var(--spacing-lg)';
  instructions.style.borderColor = 'var(--gold-dim)';

  const instructLabel = document.createElement('div');
  instructLabel.className = 'briefing-label';
  instructLabel.style.color = 'var(--gold)';
  instructLabel.textContent = 'HOW TO DECODE';
  instructions.appendChild(instructLabel);

  const instructText = document.createElement('p');
  instructText.className = 'briefing-text';
  instructText.textContent = 'Each shard is encoded differently. Copy the raw data from the Minecraft world, then figure out how to decode it. Use online tools, search engines, or your problem-solving skills. The Workbench Tools can help verify your work.';
  instructions.appendChild(instructText);

  container.appendChild(instructions);

  // SHARD A
  const shardAContainer = document.createElement('div');
  shardAContainer.className = 'checkpoint-container';

  const headerA = document.createElement('div');
  headerA.className = 'checkpoint-header';
  headerA.textContent = 'SHARD A - BINARY ';
  if (shardAVerified) {
    const statusA = document.createElement('span');
    statusA.className = 'checkpoint-status complete';
    statusA.textContent = 'VERIFIED';
    headerA.appendChild(statusA);
  }
  shardAContainer.appendChild(headerA);

  // Location for Shard A
  const locA = document.createElement('div');
  locA.style.padding = 'var(--spacing-sm) var(--spacing-md)';
  locA.style.marginBottom = 'var(--spacing-md)';
  locA.style.background = 'var(--slate-darkest)';
  locA.style.borderLeft = '3px solid var(--redstone)';
  locA.style.fontSize = '0.8rem';

  const locALabel = document.createElement('div');
  locALabel.style.color = 'var(--redstone)';
  locALabel.style.fontWeight = '600';
  locALabel.style.marginBottom = 'var(--spacing-xs)';
  locALabel.textContent = 'LOCATION';
  locA.appendChild(locALabel);

  const locAText = document.createElement('div');
  locAText.style.color = 'var(--text-secondary)';
  locAText.textContent = 'From spawn, fly down and follow the path heading South. Continue until you reach the Mill. Inside, find the large chest in the back room. The first shard awaits.';
  locA.appendChild(locAText);
  shardAContainer.appendChild(locA);

  const hintA = document.createElement('p');
  hintA.style.fontSize = '0.8rem';
  hintA.style.color = 'var(--text-muted)';
  hintA.style.marginBottom = 'var(--spacing-md)';
  hintA.style.fontStyle = 'italic';
  hintA.textContent = 'This shard uses only 0s and 1s. Each group of 8 bits represents one character. Search "binary to text converter" to decode it.';
  shardAContainer.appendChild(hintA);

  const rawGroupA = createInputGroup('RAW DATA (copy from chest)', 'phase5A-raw', 'Paste the binary exactly as found...', isReadOnly || shardAVerified, true);
  rawGroupA.querySelector('textarea').style.minHeight = '60px';
  shardAContainer.appendChild(rawGroupA);

  shardAContainer.appendChild(createInputGroup('DECODED VALUE', 'phase5A-decoded', 'What does the binary translate to?', isReadOnly || shardAVerified));

  if (!shardAVerified && !isReadOnly) {
    shardAContainer.appendChild(createSubmitButton('VERIFY SHARD A', submitShardA, isReadOnly));
  }
  shardAContainer.appendChild(createResponseDiv('phase5A-response'));
  shardAContainer.appendChild(createHintsDiv('phase5A-hints'));
  container.appendChild(shardAContainer);

  // SHARD B - Only show location after A is verified
  const shardBContainer = document.createElement('div');
  shardBContainer.className = 'checkpoint-container';
  shardBContainer.style.marginTop = 'var(--spacing-lg)';

  const headerB = document.createElement('div');
  headerB.className = 'checkpoint-header';
  headerB.textContent = 'SHARD B - BASE64 ';
  if (shardBVerified) {
    const statusB = document.createElement('span');
    statusB.className = 'checkpoint-status complete';
    statusB.textContent = 'VERIFIED';
    headerB.appendChild(statusB);
  } else if (!shardAVerified) {
    const statusB = document.createElement('span');
    statusB.className = 'checkpoint-status pending';
    statusB.textContent = 'LOCKED';
    headerB.appendChild(statusB);
  }
  shardBContainer.appendChild(headerB);

  if (shardAVerified) {
    const locB = document.createElement('div');
    locB.style.padding = 'var(--spacing-sm) var(--spacing-md)';
    locB.style.marginBottom = 'var(--spacing-md)';
    locB.style.background = 'var(--slate-darkest)';
    locB.style.borderLeft = '3px solid var(--redstone)';
    locB.style.fontSize = '0.8rem';

    const locBLabel = document.createElement('div');
    locBLabel.style.color = 'var(--redstone)';
    locBLabel.style.fontWeight = '600';
    locBLabel.style.marginBottom = 'var(--spacing-xs)';
    locBLabel.textContent = 'LOCATION';
    locB.appendChild(locBLabel);

    const locBText = document.createElement('div');
    locBText.style.color = 'var(--text-secondary)';
    locBText.textContent = 'Continue South from the Mill. Follow the path until you reach the Village. In the center, you will find a fountain. The second shard is hidden there.';
    locB.appendChild(locBText);
    shardBContainer.appendChild(locB);

    const hintB = document.createElement('p');
    hintB.style.fontSize = '0.8rem';
    hintB.style.color = 'var(--text-muted)';
    hintB.style.marginBottom = 'var(--spacing-md)';
    hintB.style.fontStyle = 'italic';
    hintB.textContent = 'This shard looks like random letters and numbers, possibly ending with = signs. Search "Base64 decoder" online to translate it.';
    shardBContainer.appendChild(hintB);

    const rawGroupB = createInputGroup('RAW DATA (copy from fountain)', 'phase5B-raw', 'Paste the Base64 exactly as found...', isReadOnly || shardBVerified, true);
    rawGroupB.querySelector('textarea').style.minHeight = '60px';
    shardBContainer.appendChild(rawGroupB);

    shardBContainer.appendChild(createInputGroup('DECODED VALUE', 'phase5B-decoded', 'What does the Base64 translate to?', isReadOnly || shardBVerified));

    if (!shardBVerified && !isReadOnly) {
      shardBContainer.appendChild(createSubmitButton('VERIFY SHARD B', submitShardB, isReadOnly));
    }
    shardBContainer.appendChild(createResponseDiv('phase5B-response'));
  } else {
    const lockedMsg = document.createElement('p');
    lockedMsg.style.fontSize = '0.8rem';
    lockedMsg.style.color = 'var(--text-dim)';
    lockedMsg.style.padding = 'var(--spacing-md)';
    lockedMsg.textContent = 'Verify Shard A to unlock the next location.';
    shardBContainer.appendChild(lockedMsg);
  }
  shardBContainer.appendChild(createHintsDiv('phase5B-hints'));
  container.appendChild(shardBContainer);

  // SHARD C - Only show location after B is verified
  const shardCContainer = document.createElement('div');
  shardCContainer.className = 'checkpoint-container';
  shardCContainer.style.marginTop = 'var(--spacing-lg)';

  const headerC = document.createElement('div');
  headerC.className = 'checkpoint-header';
  headerC.textContent = 'SHARD C - CRAFTER ENCODING ';
  if (shardCVerified) {
    const statusC = document.createElement('span');
    statusC.className = 'checkpoint-status complete';
    statusC.textContent = 'VERIFIED';
    headerC.appendChild(statusC);
  } else if (!shardBVerified) {
    const statusC = document.createElement('span');
    statusC.className = 'checkpoint-status pending';
    statusC.textContent = 'LOCKED';
    headerC.appendChild(statusC);
  }
  shardCContainer.appendChild(headerC);

  if (shardBVerified) {
    const locC = document.createElement('div');
    locC.style.padding = 'var(--spacing-sm) var(--spacing-md)';
    locC.style.marginBottom = 'var(--spacing-md)';
    locC.style.background = 'var(--slate-darkest)';
    locC.style.borderLeft = '3px solid var(--redstone)';
    locC.style.fontSize = '0.8rem';

    const locCLabel = document.createElement('div');
    locCLabel.style.color = 'var(--redstone)';
    locCLabel.style.fontWeight = '600';
    locCLabel.style.marginBottom = 'var(--spacing-xs)';
    locCLabel.textContent = 'LOCATION';
    locC.appendChild(locCLabel);

    const locCText = document.createElement('div');
    locCText.style.color = 'var(--text-secondary)';
    locCText.textContent = 'Exit the Village and follow the path heading North-East. The path climbs a hill and leads to a massive bridge. Cross it to reach the Castle. Find the Throne Room in the far back. The final shard and the assembly clue await.';
    locC.appendChild(locCText);
    shardCContainer.appendChild(locC);

    const hintC = document.createElement('p');
    hintC.style.fontSize = '0.8rem';
    hintC.style.color = 'var(--text-muted)';
    hintC.style.marginBottom = 'var(--spacing-md)';
    hintC.style.fontStyle = 'italic';
    hintC.textContent = 'This shard uses a Minecraft-themed code. Look for patterns, count items or blocks, and read any signs nearby for clues on how to decode it.';
    shardCContainer.appendChild(hintC);

    const rawGroupC = createInputGroup('RAW DATA (copy from throne room)', 'phase5C-raw', 'Paste or describe what you found...', isReadOnly || shardCVerified, true);
    rawGroupC.querySelector('textarea').style.minHeight = '60px';
    shardCContainer.appendChild(rawGroupC);

    shardCContainer.appendChild(createInputGroup('DECODED VALUE', 'phase5C-decoded', 'What does it decode to?', isReadOnly || shardCVerified));

    if (!shardCVerified && !isReadOnly) {
      shardCContainer.appendChild(createSubmitButton('VERIFY SHARD C', submitShardC, isReadOnly));
    }
    shardCContainer.appendChild(createResponseDiv('phase5C-response'));
  } else {
    const lockedMsg = document.createElement('p');
    lockedMsg.style.fontSize = '0.8rem';
    lockedMsg.style.color = 'var(--text-dim)';
    lockedMsg.style.padding = 'var(--spacing-md)';
    lockedMsg.textContent = 'Verify Shard B to unlock the next location.';
    shardCContainer.appendChild(lockedMsg);
  }
  shardCContainer.appendChild(createHintsDiv('phase5C-hints'));
  container.appendChild(shardCContainer);

  // Final submit only when all verified
  if (shardAVerified && shardBVerified && shardCVerified && !isReadOnly) {
    const completeMsg = document.createElement('div');
    completeMsg.style.marginTop = 'var(--spacing-lg)';
    completeMsg.style.padding = 'var(--spacing-md)';
    completeMsg.style.background = 'var(--emerald-dark)';
    completeMsg.style.border = '1px solid var(--emerald)';
    completeMsg.style.borderRadius = '4px';
    completeMsg.style.textAlign = 'center';
    completeMsg.style.color = 'var(--emerald)';
    completeMsg.textContent = 'All shards verified! Proceed to Phase 6 to assemble the tracking number.';
    container.appendChild(completeMsg);
  }

  renderHints('phase5A-hints', 'phase5A');
  renderHints('phase5B-hints', 'phase5B');
  renderHints('phase5C-hints', 'phase5C');
}

function submitShardA() {
  const responseEl = document.getElementById('phase5A-response');
  const decoded = (document.getElementById('phase5A-decoded') || {}).value || '';

  if (!decoded.trim()) {
    responseEl.textContent = 'Decoded value required.';
    responseEl.className = 'system-response warning';
    return;
  }

  addLogEntry('Shard A verification attempt', 'attempt');

  if (decoded.trim() === CONFIG.shardADecoded) {
    responseEl.textContent = 'SHARD A VERIFIED. Location for Shard B unlocked.';
    responseEl.className = 'system-response success';
    if (!state.phase5Verified) state.phase5Verified = {};
    state.phase5Verified.A = true;
    state.phase5Decoded.A = decoded.trim();
    saveState();
    renderPhaseContent();
  } else {
    responseEl.textContent = 'REJECTED. Decoded value incorrect.';
    responseEl.className = 'system-response error';
    getHint('phase5A');
    renderHints('phase5A-hints', 'phase5A');
  }
}

function submitShardB() {
  const responseEl = document.getElementById('phase5B-response');
  const decoded = (document.getElementById('phase5B-decoded') || {}).value || '';

  if (!decoded.trim()) {
    responseEl.textContent = 'Decoded value required.';
    responseEl.className = 'system-response warning';
    return;
  }

  addLogEntry('Shard B verification attempt', 'attempt');

  if (decoded.trim() === CONFIG.shardBDecoded) {
    responseEl.textContent = 'SHARD B VERIFIED. Location for Shard C unlocked.';
    responseEl.className = 'system-response success';
    if (!state.phase5Verified) state.phase5Verified = {};
    state.phase5Verified.B = true;
    state.phase5Decoded.B = decoded.trim();
    saveState();
    renderPhaseContent();
  } else {
    responseEl.textContent = 'REJECTED. Decoded value incorrect.';
    responseEl.className = 'system-response error';
    getHint('phase5B');
    renderHints('phase5B-hints', 'phase5B');
  }
}

function submitShardC() {
  const responseEl = document.getElementById('phase5C-response');
  const decoded = (document.getElementById('phase5C-decoded') || {}).value || '';

  if (!decoded.trim()) {
    responseEl.textContent = 'Decoded value required.';
    responseEl.className = 'system-response warning';
    return;
  }

  addLogEntry('Shard C verification attempt', 'attempt');

  if (decoded.trim() === CONFIG.shardCDecoded) {
    responseEl.textContent = 'SHARD C VERIFIED. All shards collected. Proceed to final assembly.';
    responseEl.className = 'system-response success';
    if (!state.phase5Verified) state.phase5Verified = {};
    state.phase5Verified.C = true;
    state.phase5Decoded.C = decoded.trim();
    saveState();
    completePhase(5);
    unlockTool('symbol-counter');
  } else {
    responseEl.textContent = 'REJECTED. Decoded value incorrect.';
    responseEl.className = 'system-response error';
    getHint('phase5C');
    renderHints('phase5C-hints', 'phase5C');
  }
}

// Phase 6: Final Assembly
function renderPhase6Form(container, isReadOnly) {
  // Instructions
  const instructions = document.createElement('div');
  instructions.className = 'phase-briefing';
  instructions.style.marginBottom = 'var(--spacing-lg)';
  instructions.style.borderColor = 'var(--emerald-dim)';

  const instructLabel = document.createElement('div');
  instructLabel.className = 'briefing-label';
  instructLabel.style.color = 'var(--emerald)';
  instructLabel.textContent = 'FINAL STEP';
  instructions.appendChild(instructLabel);

  const instructText = document.createElement('p');
  instructText.className = 'briefing-text';
  instructText.textContent = 'Your decoded shards from Phase 5 are shown below. The tracking number is formed by combining them in a specific order. Look for clues in the vault about which shard comes first, which is the middle, and which is last.';
  instructions.appendChild(instructText);

  container.appendChild(instructions);

  // Shard values section
  const shardsSection = document.createElement('div');
  shardsSection.className = 'checkpoint-container';

  const shardsHeader = document.createElement('div');
  shardsHeader.className = 'checkpoint-header';
  shardsHeader.textContent = 'YOUR DECODED SHARDS';
  shardsSection.appendChild(shardsHeader);

  const shardsRow = document.createElement('div');
  shardsRow.style.display = 'grid';
  shardsRow.style.gap = 'var(--spacing-md)';
  shardsRow.style.gridTemplateColumns = 'repeat(auto-fit, minmax(150px, 1fr))';

  ['A', 'B', 'C'].forEach(function(shard) {
    const group = document.createElement('div');
    group.className = 'input-group';

    const label = document.createElement('label');
    label.textContent = 'SHARD ' + shard;
    group.appendChild(label);

    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'phase6-shard' + shard;
    input.placeholder = 'Shard ' + shard;
    input.value = state.phase5Decoded[shard] || '';
    input.disabled = isReadOnly;
    input.style.textAlign = 'center';
    input.style.fontWeight = '600';
    input.style.letterSpacing = '1px';
    group.appendChild(input);

    shardsRow.appendChild(group);
  });

  shardsSection.appendChild(shardsRow);
  container.appendChild(shardsSection);

  // Ordering question
  const orderSection = document.createElement('div');
  orderSection.className = 'checkpoint-container';
  orderSection.style.marginTop = 'var(--spacing-lg)';

  const orderHeader = document.createElement('div');
  orderHeader.className = 'checkpoint-header';
  orderHeader.textContent = 'ASSEMBLY ORDER';
  orderSection.appendChild(orderHeader);

  const orderQ = document.createElement('p');
  orderQ.style.fontSize = '0.85rem';
  orderQ.style.color = 'var(--text-secondary)';
  orderQ.style.marginBottom = 'var(--spacing-md)';
  orderQ.textContent = 'The vault contains a clue about how to arrange the shards. What ordering rule did you find?';
  orderSection.appendChild(orderQ);

  const orderOptions = [
    { letter: 'A', text: 'Alphabetical (A, B, C)' },
    { letter: 'B', text: 'First seen (order found)' },
    { letter: 'C', text: 'Prefix, core, suffix' },
    { letter: 'D', text: 'Random' }
  ];

  orderSection.appendChild(createChoiceGroup('phase8', orderOptions, isReadOnly));
  container.appendChild(orderSection);

  container.appendChild(createSubmitButton('INITIATE DECRYPTION', submitPhase6, isReadOnly, 'success'));
  container.appendChild(createResponseDiv('phase6-response'));
  container.appendChild(createHintsDiv('phase6-hints'));
  renderHints('phase6-hints', 'phase8');
}

function submitPhase6() {
  const responseEl = document.getElementById('phase6-response');

  const shardA = ((document.getElementById('phase6-shardA') || {}).value || '').trim();
  const shardB = ((document.getElementById('phase6-shardB') || {}).value || '').trim();
  const shardC = ((document.getElementById('phase6-shardC') || {}).value || '').trim();
  const ordering = getSelectedChoice('phase8');

  if (!shardA || !shardB || !shardC) {
    responseEl.textContent = 'All shard values are required.';
    responseEl.className = 'system-response warning';
    return;
  }

  if (!ordering) {
    responseEl.textContent = 'Ordering rule selection required.';
    responseEl.className = 'system-response warning';
    return;
  }

  addLogEntry('Phase 6 final assembly', 'attempt');

  if (shardA !== CONFIG.shardADecoded || shardB !== CONFIG.shardBDecoded || shardC !== CONFIG.shardCDecoded) {
    responseEl.textContent = 'REJECTED. Shard values do not match verified fragments.';
    responseEl.className = 'system-response error';
    return;
  }

  if (ordering.toUpperCase() !== CONFIG.phase8OrderingAnswer.toUpperCase()) {
    responseEl.textContent = 'REJECTED. Ordering rule incorrect.';
    responseEl.className = 'system-response error';
    getHint('phase8');
    renderHints('phase6-hints', 'phase8');
    return;
  }

  responseEl.textContent = 'ACCEPTED. Initiating decryption sequence...';
  responseEl.className = 'system-response success';

  completePhase(6);
  setTimeout(function() {
    playDecryptAnimation();
  }, 1000);
}

// ═══════════════════════════════════════════════════════════════
// DECRYPT ANIMATION
// ═══════════════════════════════════════════════════════════════

function playDecryptAnimation() {
  const modal = document.getElementById('decrypt-modal');
  const sequence = document.getElementById('decrypt-sequence');

  if (!modal || !sequence) return;

  modal.classList.remove('hidden');
  addLogEntry('Decryption sequence initiated', 'system');

  const trackingNumber = CONFIG.trackingNumber;
  const steps = [
    { text: 'Initializing decryptor...', delay: 800 },
    { text: 'Verifying shard integrity...', delay: 1200 },
    { text: 'Reconstructing payload ID...', delay: 1000 },
    { text: 'Decrypting transmission...', delay: 800 }
  ];

  sequence.textContent = '';
  var currentDelay = 0;

  steps.forEach(function(step) {
    const div = document.createElement('div');
    div.className = 'decrypt-step';
    div.style.animationDelay = currentDelay + 'ms';
    div.textContent = step.text;
    sequence.appendChild(div);
    currentDelay += step.delay;
  });

  const progressContainer = document.createElement('div');
  progressContainer.className = 'decrypt-progress';
  const progressBar = document.createElement('div');
  progressBar.className = 'decrypt-progress-bar';
  progressBar.id = 'decrypt-progress';
  progressContainer.appendChild(progressBar);
  sequence.appendChild(progressContainer);

  const numberDisplay = document.createElement('div');
  numberDisplay.className = 'decrypt-number';
  numberDisplay.id = 'decrypt-number';
  sequence.appendChild(numberDisplay);

  const completeBtn = document.createElement('button');
  completeBtn.className = 'submit-btn success decrypt-complete-btn hidden';
  completeBtn.id = 'decrypt-complete-btn';
  completeBtn.textContent = 'OBSERVE COURIER PATH';
  completeBtn.onclick = closeDecryptModal;
  sequence.appendChild(completeBtn);

  const progressDelay = currentDelay;
  setTimeout(function() {
    var progress = 0;
    const interval = setInterval(function() {
      progress += 2;
      progressBar.style.width = progress + '%';
      if (progress >= 100) {
        clearInterval(interval);
        revealTrackingNumber(trackingNumber);
      }
    }, 50);
  }, progressDelay);
}

function revealTrackingNumber(number) {
  const container = document.getElementById('decrypt-number');
  const btn = document.getElementById('decrypt-complete-btn');
  if (!container) return;

  const chars = number.split('');
  const scrambleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  container.textContent = '';
  chars.forEach(function() {
    const span = document.createElement('span');
    span.className = 'decrypt-char-scramble';
    span.textContent = scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
    container.appendChild(span);
  });

  chars.forEach(function(char, index) {
    setTimeout(function() {
      const spans = container.querySelectorAll('span');
      if (spans[index]) {
        spans[index].textContent = char;
        spans[index].classList.remove('decrypt-char-scramble');
      }

      for (var i = index + 1; i < spans.length; i++) {
        spans[i].textContent = scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
      }

      if (index === chars.length - 1) {
        setTimeout(function() {
          if (btn) btn.classList.remove('hidden');
          state.decryptComplete = true;
          saveState();
          addLogEntry('COURIER PATH DECRYPTED', 'success');
        }, 500);
      }
    }, 200 * (index + 1));
  });
}

function closeDecryptModal() {
  const modal = document.getElementById('decrypt-modal');
  if (modal) modal.classList.add('hidden');
  showMissionComplete();
}

function showMissionComplete() {
  const modal = document.getElementById('complete-modal');
  const sequence = document.getElementById('complete-sequence');
  if (!modal || !sequence) return;

  sequence.textContent = '';

  // Header
  const header = document.createElement('div');
  header.className = 'complete-header';

  const icon = document.createElement('div');
  icon.className = 'complete-icon';
  icon.textContent = '\u2713';
  header.appendChild(icon);

  const title = document.createElement('div');
  title.className = 'complete-title';
  title.textContent = 'MISSION COMPLETE';
  header.appendChild(title);

  const subtitle = document.createElement('div');
  subtitle.className = 'complete-subtitle';
  subtitle.textContent = 'COURIER PATH FULLY DECRYPTED';
  header.appendChild(subtitle);

  sequence.appendChild(header);

  // Tracking number display
  const tracking = document.createElement('div');
  tracking.className = 'complete-tracking';

  const trackingLabel = document.createElement('div');
  trackingLabel.className = 'complete-tracking-label';
  trackingLabel.textContent = 'YOUR TRACKING NUMBER';
  tracking.appendChild(trackingLabel);

  const trackingNumber = document.createElement('div');
  trackingNumber.className = 'complete-tracking-number';
  trackingNumber.textContent = CONFIG.trackingNumber;
  tracking.appendChild(trackingNumber);

  sequence.appendChild(tracking);

  // Personal message
  const message = document.createElement('div');
  message.className = 'complete-message';

  const p1 = document.createElement('p');
  p1.textContent = 'Ezra, you did it. You cracked the Redstone Courier Protocol.';
  message.appendChild(p1);

  const p2 = document.createElement('p');
  p2.textContent = 'Merry Christmas! Use that tracking number to follow a special package from your parents. What is inside? That remains a mystery until it arrives on December 27th.';
  message.appendChild(p2);

  const p3 = document.createElement('p');
  p3.textContent = 'You have something rare: a mind that loves solving problems. Never lose that. Set the bar high. When something seems too hard, break it down, debug it, and conquer it. That is what master problem solvers do.';
  message.appendChild(p3);

  const p4 = document.createElement('p');
  p4.textContent = 'The world needs more builders like you. Keep learning. Keep creating. Keep pushing boundaries. Continue the wonderful journey of coding, robotics, and whatever impossible things you decide to build next.';
  message.appendChild(p4);

  const p5 = document.createElement('p');
  p5.textContent = 'Oh, and tell your parents they are pretty cool for getting you this.';
  message.appendChild(p5);

  const sig = document.createElement('div');
  sig.className = 'signature';
  sig.textContent = '- Dak';
  message.appendChild(sig);

  sequence.appendChild(message);

  // Footer with close button
  const footer = document.createElement('div');
  footer.className = 'complete-footer';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'submit-btn complete-close-btn';
  closeBtn.textContent = 'CLOSE TRANSMISSION';
  closeBtn.onclick = function() {
    modal.classList.add('hidden');
    showFinalScreen();
  };
  footer.appendChild(closeBtn);

  sequence.appendChild(footer);

  modal.classList.remove('hidden');
  addLogEntry('TRANSMISSION COMPLETE', 'success');
}

function showFinalScreen() {
  // Create full-screen overlay that takes over everything
  const overlay = document.createElement('div');
  overlay.id = 'final-screen';
  overlay.className = 'final-screen';

  const container = document.createElement('div');
  container.className = 'final-container';

  // Header
  const header = document.createElement('div');
  header.className = 'final-header';
  header.textContent = 'COURIER PROTOCOL COMPLETE';
  container.appendChild(header);

  // Tracking number display
  const trackingSection = document.createElement('div');
  trackingSection.className = 'final-tracking-section';

  const trackingLabel = document.createElement('div');
  trackingLabel.className = 'final-tracking-label';
  trackingLabel.textContent = 'YOUR TRACKING NUMBER';
  trackingSection.appendChild(trackingLabel);

  const trackingNumber = document.createElement('div');
  trackingNumber.className = 'final-tracking-number';
  trackingNumber.textContent = CONFIG.trackingNumber;
  trackingSection.appendChild(trackingNumber);

  const copyBtn = document.createElement('button');
  copyBtn.className = 'final-copy-btn';
  copyBtn.textContent = 'COPY TO CLIPBOARD';
  copyBtn.onclick = function() {
    navigator.clipboard.writeText(CONFIG.trackingNumber).then(function() {
      copyBtn.textContent = 'COPIED!';
      setTimeout(function() {
        copyBtn.textContent = 'COPY TO CLIPBOARD';
      }, 2000);
    });
  };
  trackingSection.appendChild(copyBtn);

  container.appendChild(trackingSection);

  // Instructions
  const instructions = document.createElement('div');
  instructions.className = 'final-instructions';

  const instructTitle = document.createElement('div');
  instructTitle.className = 'final-instructions-title';
  instructTitle.textContent = 'WHAT TO DO NEXT';
  instructions.appendChild(instructTitle);

  const steps = document.createElement('ol');
  steps.className = 'final-steps';

  const step1 = document.createElement('li');
  step1.textContent = 'Go to ups.com/track or search "UPS tracking" on Google';
  steps.appendChild(step1);

  const step2 = document.createElement('li');
  step2.textContent = 'Enter the tracking number above';
  steps.appendChild(step2);

  const step3 = document.createElement('li');
  step3.textContent = 'Watch your mystery package make its way to you!';
  steps.appendChild(step3);

  const step4 = document.createElement('li');
  step4.textContent = 'It should arrive December 27th between 2-7 PM';
  steps.appendChild(step4);

  instructions.appendChild(steps);
  container.appendChild(instructions);

  // Action buttons
  const actions = document.createElement('div');
  actions.className = 'final-actions';

  const trackLink = document.createElement('a');
  trackLink.href = 'https://www.ups.com/track?tracknum=' + CONFIG.trackingNumber;
  trackLink.target = '_blank';
  trackLink.className = 'final-action-btn primary';
  trackLink.textContent = 'TRACK PACKAGE NOW';
  actions.appendChild(trackLink);

  const resetBtn = document.createElement('button');
  resetBtn.className = 'final-action-btn secondary';
  resetBtn.textContent = 'RESET & PLAY AGAIN';
  resetBtn.onclick = function() {
    if (confirm('This will erase all progress and restart the challenge. Are you sure?')) {
      resetState();
      location.reload();
    }
  };
  actions.appendChild(resetBtn);

  const githubLink = document.createElement('a');
  githubLink.href = 'https://github.com/dak/RedstoneCourierProtocol';
  githubLink.target = '_blank';
  githubLink.className = 'final-action-btn tertiary';
  githubLink.textContent = 'VIEW PROJECT ON GITHUB';
  actions.appendChild(githubLink);

  container.appendChild(actions);

  // Footer
  const footer = document.createElement('div');
  footer.className = 'final-footer';
  footer.textContent = 'Merry Christmas, Ezra! - Dak';
  container.appendChild(footer);

  overlay.appendChild(container);
  document.body.appendChild(overlay);

  // Fade in
  setTimeout(function() {
    overlay.classList.add('visible');
  }, 100);
}

// ═══════════════════════════════════════════════════════════════
// PHASE COMPLETION
// ═══════════════════════════════════════════════════════════════

function completePhase(phaseId) {
  if (!state.completedPhases.includes(phaseId)) {
    state.completedPhases.push(phaseId);
    state.timestamps['phase' + phaseId] = new Date().toISOString();
    addLogEntry('Phase ' + phaseId + ' completed', 'success');
  }

  if (phaseId === state.currentPhase && phaseId < 6) {
    state.currentPhase = phaseId + 1;
    addLogEntry('Phase ' + (phaseId + 1) + ' unlocked', 'system');
  }

  saveState();
  renderPhaseNav();
  renderWorkbenchTools();

  if (phaseId < 6) {
    renderPhaseContent();
  }
}

// ═══════════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════════

function handleLogin() {
  const operatorInput = document.getElementById('login-operator');
  const sessionInput = document.getElementById('login-session');
  const responseEl = document.getElementById('login-response');

  const operator = (operatorInput ? operatorInput.value : '').trim();
  const session = (sessionInput ? sessionInput.value : '').trim();

  if (!operator || !session) {
    responseEl.textContent = 'Both fields are required.';
    responseEl.className = 'system-response warning';
    return;
  }

  const operatorMatch = operator.toLowerCase() === CONFIG.operatorId.toLowerCase();
  const sessionMatch = session === CONFIG.sessionKey;

  if (operatorMatch && sessionMatch) {
    responseEl.textContent = 'AUTHENTICATION SUCCESSFUL. Loading protocol...';
    responseEl.className = 'system-response success';

    state.authenticated = true;
    saveState();

    setTimeout(function() {
      showDashboard();
    }, 1000);
  } else {
    responseEl.textContent = 'AUTHENTICATION FAILED. Credentials do not match whitelist.';
    responseEl.className = 'system-response error';
    getHint('login');
    renderHints('login-hints', 'login');
  }
}

function showDashboard() {
  const loginScreen = document.getElementById('login-screen');
  const dashboard = document.getElementById('dashboard');
  const operatorDisplay = document.getElementById('operator-display');

  if (loginScreen) loginScreen.classList.add('hidden');
  if (dashboard) dashboard.classList.remove('hidden');
  if (operatorDisplay) operatorDisplay.textContent = CONFIG.operatorId;

  addLogEntry('Session initialized', 'system');

  renderPhaseNav();
  renderPhaseContent();
  renderMissionLog();
  renderWorkbenchTools();

  if (getTimeRemaining().expired) {
    handleExpiry();
  }
}

// ═══════════════════════════════════════════════════════════════
// ADMIN FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function openAdminModal(event) {
  if (!CONFIG.adminResetEnabled) return;
  if (!event.shiftKey || !event.altKey) return;

  const modal = document.getElementById('admin-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeAdminModal() {
  const modal = document.getElementById('admin-modal');
  if (modal) modal.classList.add('hidden');
}

function handleAdminReset() {
  const keyInput = document.getElementById('admin-key');
  const responseEl = document.getElementById('admin-response');

  const key = (keyInput ? keyInput.value : '').trim();

  if (key !== CONFIG.sessionKey) {
    responseEl.textContent = 'REJECTED. Invalid session key.';
    responseEl.className = 'system-response error';
    return;
  }

  responseEl.textContent = 'Resetting all progress...';
  responseEl.className = 'system-response warning';

  setTimeout(function() {
    resetState();
    location.reload();
  }, 1000);
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

function init() {
  updateTimers();
  setInterval(updateTimers, 1000);

  const loginBtn = document.getElementById('login-submit');
  if (loginBtn) {
    loginBtn.addEventListener('click', handleLogin);
  }

  const adminGear = document.getElementById('admin-gear');
  if (adminGear) {
    adminGear.addEventListener('click', openAdminModal);
  }

  const adminResetBtn = document.getElementById('admin-reset-btn');
  if (adminResetBtn) {
    adminResetBtn.addEventListener('click', handleAdminReset);
  }

  const sessionField = document.getElementById('login-session');
  if (sessionField) {
    sessionField.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') handleLogin();
    });
  }

  const operatorField = document.getElementById('login-operator');
  if (operatorField) {
    operatorField.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') handleLogin();
    });
  }

  if (state.authenticated) {
    showDashboard();
  }

  renderHints('login-hints', 'login');
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeToolModal();
    closeAdminModal();
  }
});

document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal')) {
    closeToolModal();
    closeAdminModal();
  }
});

// ═══════════════════════════════════════════════════════════════
// AMBIENT MUSIC
// ═══════════════════════════════════════════════════════════════

const YOUTUBE_VIDEO_ID = '3pbvmR8n27w';
let musicPlaying = false;
let youtubePlayer = null;

function initMusicToggle() {
  const toggleBtn = document.getElementById('music-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleMusic);
  }

  // Auto-start music on page load
  // Note: Browsers may block autoplay until user interacts with page
  setTimeout(function() {
    if (!musicPlaying) {
      toggleMusic();
    }
  }, 500);
}

function toggleMusic() {
  const toggleBtn = document.getElementById('music-toggle');
  const statusEl = document.getElementById('music-status');
  const iframe = document.getElementById('youtube-player');

  if (!musicPlaying) {
    // Start playing - load YouTube with autoplay and loop
    if (iframe) {
      iframe.src = 'https://www.youtube.com/embed/' + YOUTUBE_VIDEO_ID + '?autoplay=1&loop=1&playlist=' + YOUTUBE_VIDEO_ID + '&enablejsapi=1';
    }
    musicPlaying = true;
    if (toggleBtn) toggleBtn.classList.add('playing');
    if (statusEl) statusEl.textContent = 'ON';
    addLogEntry('Ambient music enabled', 'system');
  } else {
    // Stop playing
    if (iframe) {
      iframe.src = '';
    }
    musicPlaying = false;
    if (toggleBtn) toggleBtn.classList.remove('playing');
    if (statusEl) statusEl.textContent = 'OFF';
    addLogEntry('Ambient music disabled', 'system');
  }
}

document.addEventListener('DOMContentLoaded', function() {
  init();
  initMusicToggle();
});
