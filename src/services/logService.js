import { reactive, readonly } from 'vue';

export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const LOG_LEVEL_KEY = 'requiform_logLevel';
const MAX_LOG_ENTRIES = 500; // Maximum number of log entries to keep

// Get initial log level from localStorage or default to INFO
const getInitialLogLevel = () => {
  const savedLevel = localStorage.getItem(LOG_LEVEL_KEY);
  if (savedLevel !== null && LogLevel[savedLevel.toUpperCase()] !== undefined) {
    return LogLevel[savedLevel.toUpperCase()];
  }
  return LogLevel.INFO; // Restore default to INFO
};

// Reactive state for log entries and current level
const state = reactive({
  logEntries: [],
  currentLogLevel: getInitialLogLevel(),
});

// Function to add a log entry
const addLogEntry = (level, ...args) => {
  if (level < state.currentLogLevel || args.length === 0) {
    return; // Skip logging if level is below current setting or no args
  }

  const timestamp = new Date().toISOString();
  const levelName = Object.keys(LogLevel).find(key => LogLevel[key] === level);

  let displayMessage = '';
  let rawData = null;

  // Handle first argument (primary message)
  if (typeof args[0] === 'string') {
    displayMessage = args[0];
  } else {
    // First arg is not a string, try to summarize it
    try {
      displayMessage = `Object logged: ${JSON.stringify(args[0]).substring(0, 100)}...`;
    } catch (e) {
      displayMessage = `Object logged: [Serialization Error: ${e.message}]`;
    }
    // If only one arg and it's not a string, it's the raw data
    if (args.length === 1) {
       rawData = args[0];
    }
  }

  // Handle additional arguments (store as rawData)
  if (args.length > 1) {
    // Store second arg directly if only two args, otherwise store array of remaining args
    rawData = args.length === 2 ? args[1] : args.slice(1);
  }

  state.logEntries.push({ timestamp, level: levelName, displayMessage, rawData });

  // Limit the number of log entries
  if (state.logEntries.length > MAX_LOG_ENTRIES) {
    state.logEntries.shift(); // Remove the oldest entry (FIFO)
  }
};

// Logging functions
const log = {
  // Update logging methods to use rest parameters
  debug: (...args) => addLogEntry(LogLevel.DEBUG, ...args),
  info: (...args) => addLogEntry(LogLevel.INFO, ...args),
  warn: (...args) => addLogEntry(LogLevel.WARN, ...args),
  error: (...args) => addLogEntry(LogLevel.ERROR, ...args),

  /**
   * Sets the minimum log level.
   * @param {number} level - The LogLevel enum value (e.g., LogLevel.INFO).
   */
  setLevel: (level) => {
    if (Object.values(LogLevel).includes(level)) {
      state.currentLogLevel = level;
      const levelName = Object.keys(LogLevel).find(key => LogLevel[key] === level);
      if (levelName) {
        localStorage.setItem(LOG_LEVEL_KEY, levelName);
        log.info(`Log level set to ${levelName}`);
      }
    } else {
      log.warn(`Invalid log level attempted: ${level}`);
    }
  },

  // Expose readonly state for components
  get entries() {
    return readonly(state.logEntries);
  },
  get currentLogLevel() {
    return state.currentLogLevel;
  },
  get level() {
    return state.currentLogLevel;
  },

  // Function to clear logs
  clear: () => {
    state.logEntries.length = 0; // Clear the array efficiently
    log.info('Logs cleared.');
  }
};

export default log;
