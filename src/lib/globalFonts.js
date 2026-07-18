import React from "react";
import { Text, TextInput } from "react-native";

export const FONT = {
  serif: "SourceSerif4_600SemiBold",
  serifItalic: "SourceSerif4_400Regular_Italic",
  sans: "Inter_400Regular",
  sansMedium: "Inter_500Medium",
  sansSemibold: "Inter_600SemiBold",
};

let patched = false;

// React Native has no notion of a global default font, so every Text /
// TextInput would otherwise need an explicit fontFamily. Patching the
// render output once, here, keeps the component code close to the
// original web version (which relied on a single CSS font-family rule).
export function applyGlobalFont() {
  if (patched) return;
  patched = true;

  const oldTextRender = Text.render;
  Text.render = function (...args) {
    const origin = oldTextRender.call(this, ...args);
    return React.cloneElement(origin, {
      style: [{ fontFamily: FONT.sans }, origin.props.style],
    });
  };

  const oldInputRender = TextInput.render;
  TextInput.render = function (...args) {
    const origin = oldInputRender.call(this, ...args);
    return React.cloneElement(origin, {
      style: [{ fontFamily: FONT.sans }, origin.props.style],
    });
  };
}
