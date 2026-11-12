// Hailuo AI Enter/Shift+Enter behavior swap
// Covers hailuoai.com (China) and hailuoai.video (Global).
// Depends on enter-behavior-utils.js and button-finder-utils.js.

const HAILUO_INPUT_SELECTORS = [
  'div[contenteditable="true"][role="textbox"]',
  'div[contenteditable="true"]',
  'textarea'
];

const HAILUO_SEND_BUTTON_SELECTORS = [
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

function isHailuoInput(element) {
  if (!element || element.offsetParent === null) {
    return false;
  }

  if (element.tagName === 'TEXTAREA') {
    return !element.disabled && !element.readOnly;
  }

  return element.getAttribute('contenteditable') === 'true';
}

function insertHailuoNewline(editor) {
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

function dispatchHailuoEnter(input) {
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
  if (!isHailuoInput(input)) {
    return;
  }

  if (matchesModifiers(event, enterKeyConfig.newlineModifiers)) {
    event.preventDefault();
    event.stopImmediatePropagation();
    insertHailuoNewline(input);
    return;
  }

  if (!matchesModifiers(event, enterKeyConfig.sendModifiers)) {
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();

  const sendButton = window.ButtonFinderUtils?.findButton(HAILUO_SEND_BUTTON_SELECTORS);
  if (sendButton && !sendButton.disabled && sendButton.getAttribute('aria-disabled') !== 'true') {
    sendButton.click();
    return;
  }

  dispatchHailuoEnter(input);
}

applyEnterSwapSetting();
