import React from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { FONT } from "../lib/globalFonts";

/* ---------- small reusable bits (ported from the web version's HTML/Tailwind) ---------- */

export function TextLine({ value, onChange, placeholder }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor="#a39c8f"
      className="w-full text-[15px] py-1.5"
      style={{ borderBottomWidth: 1, borderColor: "#D9D2C6", color: "#3A332C" }}
    />
  );
}

export function CheckRow({ item, onToggle, onText, accent, placeholder }) {
  return (
    <View className="flex-row items-center gap-3 py-1.5">
      <Pressable
        onPress={onToggle}
        hitSlop={8}
        className="w-5 h-5 rounded-md items-center justify-center"
        style={{
          borderWidth: 2,
          borderColor: item.checked ? accent : "#C9C0B2",
          backgroundColor: item.checked ? accent : "transparent",
        }}
      >
        {item.checked && <Text className="text-white text-[11px]">✓</Text>}
      </Pressable>
      <TextInput
        value={item.text}
        onChangeText={onText}
        placeholder={placeholder}
        placeholderTextColor="#a39c8f"
        className="flex-1 text-[15px] py-1"
        style={{
          borderBottomWidth: 1,
          borderColor: "#D9D2C6",
          color: item.checked ? "#8a8377" : "#3A332C",
          textDecorationLine: item.checked ? "line-through" : "none",
        }}
      />
    </View>
  );
}

export function FixedCheck({ label, checked, onToggle, accent }) {
  return (
    <Pressable onPress={onToggle} className="flex-row items-center gap-3 py-1.5">
      <View
        className="w-5 h-5 rounded-md items-center justify-center"
        style={{
          borderWidth: 2,
          borderColor: checked ? accent : "#C9C0B2",
          backgroundColor: checked ? accent : "transparent",
        }}
      >
        {checked && <Text className="text-white text-[11px]">✓</Text>}
      </View>
      <Text
        className="text-[15px]"
        style={{ color: checked ? "#8a8377" : "#3A332C", textDecorationLine: checked ? "line-through" : "none" }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function TextArea({ value, onChange, placeholder, rows = 6 }) {
  const lineHeight = 32;
  const minHeight = rows * lineHeight;
  return (
    <View style={{ position: "relative", minHeight }}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {Array.from({ length: rows + 2 }).map((_, i) => (
          <View key={i} style={{ height: lineHeight, borderBottomWidth: 1, borderColor: "#DED6C8" }} />
        ))}
      </View>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#a39c8f"
        multiline
        textAlignVertical="top"
        className="text-[15px]"
        style={{ color: "#3A332C", lineHeight, minHeight }}
      />
    </View>
  );
}

export function SectionHeader({ eyebrow, title, subtitle, accent, header, onBack, crumbs }) {
  return (
    <View style={{ backgroundColor: header, borderBottomWidth: 2, borderBottomColor: "#0000000f" }} className="px-6 pt-6 pb-5">
      <View className="flex-row items-center justify-between mb-4 flex-wrap gap-2">
        <View className="flex-row items-center gap-2 flex-wrap">
          <Pressable onPress={onBack} className="px-3 py-1.5 rounded-full" style={{ backgroundColor: "#5C5346" }}>
            <Text className="text-white text-[13px] font-medium tracking-wide">Home</Text>
          </Pressable>
          {crumbs}
        </View>
        {!!eyebrow && (
          <Text className="text-[13px] italic" style={{ color: "#6b6459" }}>
            {eyebrow}
          </Text>
        )}
      </View>
      <Text className="text-[34px]" style={{ color: "#2E2A26", fontFamily: FONT.serif }}>
        {title}
      </Text>
      {!!subtitle && (
        <Text className="italic text-[15px] mt-1" style={{ color: "#6b6459" }}>
          {subtitle}
        </Text>
      )}
      <View className="h-[3px] w-full mt-5 rounded-full" style={{ backgroundColor: accent }} />
    </View>
  );
}

export function Card({ title, blurb, accent, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-2xl p-5 w-full"
      style={({ pressed }) => [
        { borderWidth: 1, borderColor: "#E7E1D6" },
        pressed && { opacity: 0.85 },
      ]}
    >
      <Text className="text-[19px] mb-3" style={{ color: accent, fontFamily: FONT.serif }}>
        {title}
      </Text>
      <View className="rounded-lg px-3 py-2" style={{ backgroundColor: "#F1ECE3" }}>
        <Text className="text-[13px]" style={{ color: "#6b6459" }}>
          {blurb}
        </Text>
      </View>
    </Pressable>
  );
}

export function Crumb({ label, onPress, active, full }) {
  return (
    <Pressable
      onPress={onPress}
      className={`px-3 py-1.5 rounded-full ${full ? "w-full items-center" : ""}`}
      style={({ pressed }) => [
        { borderWidth: 1, borderColor: active ? "#5C5346" : "#C9C0B2", backgroundColor: active ? "#EAE4D8" : "transparent" },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text className="text-[13px]" style={{ color: active ? "#3A332C" : "#6b6459" }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Footer() {
  return (
    <View className="px-6 py-4 flex-row items-center justify-between" style={{ backgroundColor: "#F4F0E8" }}>
      <Text className="text-[12px]" style={{ color: "#9c9587" }}>
        Radiating Prints
      </Text>
      <Text className="text-[12px] hidden sm:flex" style={{ color: "#9c9587" }}>
        tap Home to return to the dashboard
      </Text>
      <Text className="text-[12px]" style={{ color: "#9c9587" }}>
        © 2026 Radiating Prints
      </Text>
    </View>
  );
}

export function PaperBackground({ style }) {
  if (style === "blank") return null;

  if (style === "lined") {
    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {Array.from({ length: 24 }).map((_, i) => (
          <View key={i} style={{ height: 31, borderBottomWidth: 1, borderColor: "#DED6C8" }} />
        ))}
      </View>
    );
  }

  if (style === "graph") {
    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {Array.from({ length: 24 }).map((_, i) => (
          <View key={i} style={{ height: 22, flexDirection: "row", borderBottomWidth: 1, borderColor: "#E2DACC" }}>
            {Array.from({ length: 16 }).map((_, j) => (
              <View key={j} style={{ width: 22, borderRightWidth: 1, borderColor: "#E2DACC" }} />
            ))}
          </View>
        ))}
      </View>
    );
  }

  // dot grid
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: 24 }).map((_, i) => (
        <View key={i} style={{ height: 18, flexDirection: "row" }}>
          {Array.from({ length: 20 }).map((_, j) => (
            <View key={j} style={{ width: 18, alignItems: "center", justifyContent: "center" }}>
              <View style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: "#C9C0B2" }} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
