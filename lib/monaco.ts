import { editor } from "monaco-editor"

export const monacoOptions: editor.IStandaloneEditorConstructionOptions = {
  minimap: { enabled: false },
  fontSize: 14,
  lineNumbers: "on",
  roundedSelection: false,
  scrollBeyondLastLine: false,
  readOnly: false,
  automaticLayout: true,
  wordWrap: "on",
  renderWhitespace: "selection",
  tabSize: 2,
  insertSpaces: true,
  autoClosingBrackets: "always",
  autoClosingQuotes: "always",
  formatOnPaste: true,
  formatOnType: true,
  suggestOnTriggerCharacters: true,
  acceptSuggestionOnEnter: "on",
  tabCompletion: "on",
  wordBasedSuggestions: true,
  parameterHints: { enabled: true },
  quickSuggestions: {
    other: true,
    comments: true,
    strings: true,
  },
} 