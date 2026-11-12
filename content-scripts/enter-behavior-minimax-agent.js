// MiniMax Agent Enter/Shift+Enter behavior swap
// Covers agent.minimax.io, agent.minimax.cn and agent.minimaxi.com.
// Depends on enter-behavior-utils.js and button-finder-utils.js.

const MINIMAX_AGENT_INPUT_SELECTORS = [
  '[data-testid="chat-input"] textarea',
  'div[contenteditable="true"][role="textbox"]',
  '.ProseMirror[contenteditable="true"]',
  'textarea[placeholder]',
  'textarea'
];

const MINIMAX_AGENT_SEND_BUTTON_SELECTORS = [
  {
    type: 'css',
    value: 'button[aria-label="Send"]'
  },
  {
    type: 'css',
    value: 'button[aria-label="发送"]'
  },
  {
    type: 'aria',
    textKey: 'send'
  },
  {
    type: 'css',
    value: 'button[type="submit"]'
  }
];

function isMinimaxAgentInput(element) {
  if (!element || element.offsetParent === null) {
    return false;
  }

  if (element.tagName === 'TEXTAREA') {
    return !element.disabled && !element.readOnly;
  }

  return element.getAttribute('contenteditable') === 'true';
}

function insertMinimaxAgentNewline(editor) {
  editor.focus();

  if (editor.tagName === 'TEXTAREA') {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    editor.setRangeText('\n', start, end, 'end');
    editor.dispatchEvent(new Event('input', { bubbles: true }));
    editor.dispatchEvent(new Event('change', { bubbles: true }));
    return;
  }

  for (const command of ['insertParagraph', 'insertLineBreak']) {
    try {
      if (document.execCommand(command, false)) {
        return;
      }
    } catch (error) {
      // Try the other native editing command.
    }
  }

  const selection = window.getSelection();
  if (!selection?.rangeCount || !editor.contains(selection.anchorNode)) {
    return;
  }
  const range = selection.getRangeAt(0);
  range.deleteContents();
  const lineBreak = document.createElement('br');
  range.insertNode(lineBreak);
  range.setStartAfter(lineBreak);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
  editor.dispatchEvent(new Event('input', { bubbles: true }));
}

function dispatchMinimaxAgentEnter(input) {
  input.dispatchEvent(new KeyboardEvent('keydown', {
    key: 'Enter',
    code: 'Enter',
    keyCode: 13,
    which: 13,
    bubbles: true,
    cancelable: true
  }));
}

function handleEnterSwap(event) {
  if (!event.isTrusted || event.code !== 'Enter' || event.isComposing || !enterKeyConfig?.enabled) {
    return;
  }

  const input = document.activeElement;
  if (!isMinimaxAgentInput(input)) {
    return;
  }

  if (matchesModifiers(event, enterKeyConfig.newlineModifiers)) {
    event.preventDefault();
    event.stopImmediatePropagation();
    insertMinimaxAgentNewline(input);
    return;
  }

  if (!matchesModifiers(event, enterKeyConfig.sendModifiers)) {
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();

  const sendButton = window.ButtonFinderUtils?.findButton(MINIMAX_AGENT_SEND_BUTTON_SELECTORS);
  if (sendButton && !sendButton.disabled && sendButton.getAttribute('aria-disabled') !== 'true') {
    sendButton.click();
    return;
  }

  dispatchMinimaxAgentEnter(input);
}

applyEnterSwapSetting();
