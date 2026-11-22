export interface KeyboardKey {
  label: string;
  quarters?: number;
  shift?: string;
  front?: string;
  modifier?: boolean;
}

const mod = (label: string, quarters = 4, front?: string): KeyboardKey =>
  ({ label, quarters, front, modifier: true });
const key = (label: string, shift?: string, front?: string): KeyboardKey => ({ label, shift, front });

// Quarter-unit widths and legends follow PFU's HHKB Professional US key matrix.
export const keyboardRows: KeyboardKey[][] = [
  [
    mod("Esc", 4, "Power"), key("1", "!", "F1"), key("2", "@", "F2"), key("3", "#", "F3"),
    key("4", "$", "F4"), key("5", "%", "F5"), key("6", "^", "F6"), key("7", "&", "F7"),
    key("8", "*", "F8"), key("9", "(", "F9"), key("0", ")", "F10"), key("-", "_", "F11"),
    key("=", "+", "F12"), key("\\", "|", "Ins"), key("`", "~", "Del"),
  ],
  [
    mod("Tab", 6, "Caps"), ...Array.from("QWERTYU", label => key(label)),
    key("I", undefined, "PSc/SRq"), key("O", undefined, "ScrLk"), key("P", undefined, "Pus/Brk"),
    key("[", "{", "↑"), key("]", "}"), mod("Delete", 6, "BS"),
  ],
  [
    mod("Control", 7), key("A", undefined, "Vol_Dn"), key("S", undefined, "Vol_Up"),
    key("D", undefined, "Mute"), key("F", undefined, "Eject"), key("G"), key("H", undefined, "∗"),
    key("J", undefined, "/"), key("K", undefined, "Home"), key("L", undefined, "PgUp"),
    key(";", ":", "←"), key("'", '"', "→"), mod("Return", 9, "Enter"),
  ],
  [
    mod("Shift", 9), ...Array.from("ZXCVB", label => key(label)), key("N", undefined, "+"), key("M", undefined, "−"),
    key(",", "<", "End"), key(".", ">", "PgDn"), key("/", "?", "↓"), mod("Shift", 7), mod("Fn"),
  ],
  [
    { ...mod("Alt"), shift: "Opt" }, { ...mod("◇", 6), shift: "⌘" }, { label: "", quarters: 24 },
    { ...mod("◇", 6, "Stop"), shift: "⌘" }, { ...mod("Alt"), shift: "Opt" },
  ],
];
