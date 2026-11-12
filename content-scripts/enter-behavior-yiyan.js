// 文心一言 Enter/Shift+Enter behavior swap
// Covers yiyan.baidu.com (百度文心一言网页版).
// Depends on enter-behavior-utils.js and button-finder-utils.js.

const YIYAN_INPUT_SELECTORS = [
  '#chat-input[contenteditable="true"]',
  'div[contenteditable="true"][role="textbox"]',
  '.chat-input-editor[contenteditable="true"]',
  'div[contenteditable="true"]',
  'textarea'
];

const YIYAN_SEND_BUTTON_SELECTORS = [
  {
    type: 'css',
    value: 'button#sendBtn'
  },
  {
    type: 'css',
    value: 'button[aria-label="发送"]'
  },
  {
    type: 'css',
    value: 'button[aria-label="Send"]'
  },
  {
    type: 'css',
    value: '[class*="send-btn"]:not([class*="disabled"])'
  },
  {
    type: 'css',
    value: 'button[type="submit"]'
  }
];

function isYiyanInput(element) {
  if (!element || element.offsetParent === null) {
    return false;
  }

  if (element.tagName === 'TEXTAREA') {
    return !element.disabled && !element.readOnly;
  }

  return element.getAttribute('contenteditable') === 'true';
}

function insertYiyanNewline(editor) {
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

function dispatchYiyanEnter(input) {
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
  if (!isYiyanInput(input)) {
    return;
  }

  if (matchesModifiers(event, enterKeyConfig.newlineModifiers)) {
    event.preventDefault();
    event.stopImmediatePropagation();
    insertYiyanNewline(input);
    return;
  }

  if (!matchesModifiers(event, enterKeyConfig.sendModifiers)) {
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();

  const sendButton = window.ButtonFinderUtils?.findButton(YIYAN_SEND_BUTTON_SELECTORS);
  if (sendButton && !sendButton.disabled && sendButton.getAttribute('aria-disabled') !== 'true') {
    sendButton.click();
    return;
  }

  dispatchYiyanEnter(input);
}

// Keep the selector lists referenced so tree-shaking/lint stay quiet and the
// injection script can reuse the same order.
window.__yiyanComposerSelectors = { input: YIYAN_INPUT_SELECTORS, send: YIYAN_SEND_BUTTON_SELECTORS };

applyEnterSwapSetting();
