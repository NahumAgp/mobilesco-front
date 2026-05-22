const LEFT_ODD = {
  0: "0001101",
  1: "0011001",
  2: "0010011",
  3: "0111101",
  4: "0100011",
  5: "0110001",
  6: "0101111",
  7: "0111011",
  8: "0110111",
  9: "0001011"
};

const LEFT_EVEN = {
  0: "0100111",
  1: "0110011",
  2: "0011011",
  3: "0100001",
  4: "0011101",
  5: "0111001",
  6: "0000101",
  7: "0010001",
  8: "0001001",
  9: "0010111"
};

const RIGHT = {
  0: "1110010",
  1: "1100110",
  2: "1101100",
  3: "1000010",
  4: "1011100",
  5: "1001110",
  6: "1010000",
  7: "1000100",
  8: "1001000",
  9: "1110100"
};

const PARITY = {
  0: "OOOOOO",
  1: "OOEOEE",
  2: "OOEEOE",
  3: "OOEEEO",
  4: "OEOOEE",
  5: "OEEOOE",
  6: "OEEEOO",
  7: "OEOEOE",
  8: "OEOEEO",
  9: "OEEOEO"
};

export function obtenerBitsEan13(value) {
  const codigo = String(value || "").replace(/\D/g, "");

  if (codigo.length !== 13) {
    return "";
  }

  const digitos = codigo.split("").map(Number);
  const paridad = PARITY[digitos[0]];
  let bits = "101";

  for (let i = 1; i <= 6; i += 1) {
    bits += paridad[i - 1] === "O" ? LEFT_ODD[digitos[i]] : LEFT_EVEN[digitos[i]];
  }

  bits += "01010";

  for (let i = 7; i <= 12; i += 1) {
    bits += RIGHT[digitos[i]];
  }

  bits += "101";
  return bits;
}
