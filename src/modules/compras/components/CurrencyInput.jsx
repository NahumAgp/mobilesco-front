import { useState } from "react";
import { formatMoneyAmount } from "../utils/money";

export default function CurrencyInput({ value, onValueChange, ...props }) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState("");

  const handleChange = (event) => {
    const next = event.target.value;
    if (!/^\d*(?:\.\d{0,4})?$/.test(next)) return;
    setDraft(next);
    const parsed = Number(next);
    if (Number.isFinite(parsed)) onValueChange(parsed);
  };

  return (
    <input
      {...props}
      type="text"
      inputMode="decimal"
      value={focused ? draft : value === "" || value === null || value === undefined ? "" : formatMoneyAmount(value)}
      onFocus={() => { setDraft(value === "" || value === null || value === undefined ? "" : String(value)); setFocused(true); }}
      onBlur={() => setFocused(false)}
      onChange={handleChange}
    />
  );
}
