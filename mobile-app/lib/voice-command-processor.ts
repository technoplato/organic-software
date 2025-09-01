/**
 * Voice Command Processor
 * 
 * Processes voice commands using a simple pattern matching system
 * that can be enhanced with LLM integration later.
 */

export interface VoiceCommand {
  action: string;
  confidence: number;
  parameters?: Record<string, any>;
  cleanedText: string;
}

export enum CommandAction {
  // Text controls
  TEXT_SIZE_INCREASE = 'TEXT_SIZE_INCREASE',
  TEXT_SIZE_DECREASE = 'TEXT_SIZE_DECREASE',
  LINE_SPACING_INCREASE = 'LINE_SPACING_INCREASE',
  LINE_SPACING_DECREASE = 'LINE_SPACING_DECREASE',
  
  // Display modes
  MODE_TRANSCRIPTION = 'MODE_TRANSCRIPTION',
  MODE_CONVERSATION = 'MODE_CONVERSATION',
  MODE_HYBRID = 'MODE_HYBRID',
  
  // Message actions
  SEND_MESSAGE = 'SEND_MESSAGE',
  CLEAR_CONVERSATION = 'CLEAR_CONVERSATION',
  COPY_TEXT = 'COPY_TEXT',
  
  // System controls
  SHOW_SETTINGS = 'SHOW_SETTINGS',
  HIDE_SETTINGS = 'HIDE_SETTINGS',
  START_LISTENING = 'START_LISTENING',
  STOP_LISTENING = 'STOP_LISTENING',
  
  // Navigation
  SCROLL_UP = 'SCROLL_UP',
  SCROLL_DOWN = 'SCROLL_DOWN',
  
  // No command detected
  NO_COMMAND = 'NO_COMMAND',
}

// Command patterns with multiple trigger phrases
const COMMAND_PATTERNS = [
  // Text size controls
  {
    action: CommandAction.TEXT_SIZE_INCREASE,
    patterns: [
      /\b(increase|make|bigger|larger|zoom in)\s+(text|font|size)\b/i,
      /\bmake\s+(text|font)\s+(bigger|larger)\b/i,
      /\b(bigger|larger)\s+(text|font)\b/i,
      /\bzoom\s+in\b/i,
    ],
  },
  {
    action: CommandAction.TEXT_SIZE_DECREASE,
    patterns: [
      /\b(decrease|make|smaller|reduce|zoom out)\s+(text|font|size)\b/i,
      /\bmake\s+(text|font)\s+(smaller|tinier)\b/i,
      /\b(smaller|tinier)\s+(text|font)\b/i,
      /\bzoom\s+out\b/i,
    ],
  },
  
  // Display modes
  {
    action: CommandAction.MODE_TRANSCRIPTION,
    patterns: [
      /\b(transcription|transcript)\s+(mode|view)\b/i,
      /\bshow\s+(transcription|transcript)\b/i,
      /\b(switch|go)\s+to\s+(transcription|transcript)\b/i,
    ],
  },
  {
    action: CommandAction.MODE_CONVERSATION,
    patterns: [
      /\b(conversation|chat)\s+(mode|view)\b/i,
      /\bshow\s+(conversation|chat)\b/i,
      /\b(switch|go)\s+to\s+(conversation|chat)\b/i,
    ],
  },
  {
    action: CommandAction.MODE_HYBRID,
    patterns: [
      /\bhybrid\s+(mode|view)\b/i,
      /\bsplit\s+(view|screen)\b/i,
      /\bshow\s+both\b/i,
    ],
  },
  
  // Message actions
  {
    action: CommandAction.SEND_MESSAGE,
    patterns: [
      /\b(send|submit)\s+(message|it|this)\b/i,
      /\b(send|done|submit)\b$/i,
    ],
  },
  {
    action: CommandAction.CLEAR_CONVERSATION,
    patterns: [
      /\b(clear|delete|remove)\s+(screen|conversation|messages|all)\b/i,
      /\b(start|begin)\s+(over|new|fresh)\b/i,
      /\bnew\s+conversation\b/i,
      /\breset\b/i,
    ],
  },
  {
    action: CommandAction.COPY_TEXT,
    patterns: [
      /\bcopy\s+(text|transcript|this|it)\b/i,
      /\bcopy\s+to\s+clipboard\b/i,
    ],
  },
  
  // System controls
  {
    action: CommandAction.SHOW_SETTINGS,
    patterns: [
      /\b(show|open|display)\s+settings\b/i,
      /\bsettings\b$/i,
    ],
  },
  {
    action: CommandAction.HIDE_SETTINGS,
    patterns: [
      /\b(hide|close|dismiss)\s+settings\b/i,
      /\bclose\s+(settings|this)\b/i,
    ],
  },
  {
    action: CommandAction.START_LISTENING,
    patterns: [
      /\b(start|begin)\s+(listening|recording)\b/i,
      /\blisten\b$/i,
    ],
  },
  {
    action: CommandAction.STOP_LISTENING,
    patterns: [
      /\b(stop|pause|end)\s+(listening|recording)\b/i,
      /\b(stop|pause)\b$/i,
    ],
  },
  
  // Navigation
  {
    action: CommandAction.SCROLL_UP,
    patterns: [
      /\bscroll\s+up\b/i,
      /\bgo\s+up\b/i,
    ],
  },
  {
    action: CommandAction.SCROLL_DOWN,
    patterns: [
      /\bscroll\s+down\b/i,
      /\bgo\s+down\b/i,
    ],
  },
];

/**
 * Process voice input to detect commands
 */
export function processVoiceCommand(text: string): VoiceCommand {
  const normalizedText = text.toLowerCase().trim();
  
  // Check each command pattern
  for (const commandDef of COMMAND_PATTERNS) {
    for (const pattern of commandDef.patterns) {
      const match = normalizedText.match(pattern);
      if (match) {
        // Remove the command phrase from the text
        const cleanedText = text.replace(pattern, '').trim();
        
        return {
          action: commandDef.action,
          confidence: 0.9, // High confidence for pattern matches
          cleanedText,
          parameters: extractParameters(commandDef.action, match),
        };
      }
    }
  }
  
  // No command detected
  return {
    action: CommandAction.NO_COMMAND,
    confidence: 0,
    cleanedText: text,
  };
}

/**
 * Extract parameters from command matches
 */
function extractParameters(action: CommandAction, match: RegExpMatchArray): Record<string, any> {
  const params: Record<string, any> = {};
  
  switch (action) {
    case CommandAction.TEXT_SIZE_INCREASE:
    case CommandAction.TEXT_SIZE_DECREASE:
      // Could extract specific size values if mentioned
      if (match[0].includes('big') || match[0].includes('large')) {
        params.amount = 'large';
      } else if (match[0].includes('small') || match[0].includes('tiny')) {
        params.amount = 'small';
      } else {
        params.amount = 'normal';
      }
      break;
      
    default:
      // No special parameters for other commands
      break;
  }
  
  return params;
}

/**
 * Check if text contains message trigger words
 */
export function containsMessageTrigger(text: string, triggerWords: string[]): boolean {
  const normalizedText = text.toLowerCase();
  return triggerWords.some(trigger => 
    normalizedText.includes(trigger.toLowerCase())
  );
}

/**
 * Remove trigger words from text
 */
export function removeTriggerWords(text: string, triggerWords: string[]): string {
  let cleanedText = text;
  
  triggerWords.forEach(trigger => {
    const regex = new RegExp(`\\b${trigger.toLowerCase()}\\b`, 'gi');
    cleanedText = cleanedText.replace(regex, '');
  });
  
  return cleanedText.trim();
}

/**
 * Future: LLM-based command processing
 * This can be enhanced with AI SDK integration for more natural language understanding
 */
export async function processVoiceCommandWithLLM(text: string): Promise<VoiceCommand> {
  // TODO: Integrate with AI SDK for more sophisticated command detection
  // For now, fall back to pattern matching
  return processVoiceCommand(text);
}