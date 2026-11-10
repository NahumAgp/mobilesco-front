import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import CurrencyInput from "./CurrencyInput";

describe("CurrencyInput", () => {
  it("muestra miles y dos decimales sin redondear el valor enviado", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    function Example() {
      const [value, setValue] = useState(0);
      return <CurrencyInput aria-label="Importe" value={value} onValueChange={(next) => { setValue(next); onValueChange(next); }} />;
    }

    render(<Example />);
    const input = screen.getByRole("textbox", { name: "Importe" });
    await user.clear(input);
    await user.type(input, "1234.5678");
    await user.tab();

    expect(input).toHaveValue("1,234.57");
    expect(onValueChange).toHaveBeenLastCalledWith(1234.5678);
  });
});
