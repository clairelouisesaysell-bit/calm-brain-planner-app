import React, { useState } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useAuth } from "../lib/AuthContext";

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState("signIn"); // "signIn" | "signUp"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError("");
    setInfo("");
    if (!email || !password) {
      setError("Enter an email and password.");
      return;
    }
    setBusy(true);
    const { error: err } =
      mode === "signIn" ? await signIn(email.trim(), password) : await signUp(email.trim(), password);
    setBusy(false);
    if (err) {
      setError(err.message);
    } else if (mode === "signUp") {
      setInfo("Account created. Check your email if confirmation is required, then sign in.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: "#F4F0E8" }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }} keyboardShouldPersistTaps="handled">
        <View className="px-8 py-16 items-center">
          <View className="px-6 py-4 rounded-2xl shadow-md mb-8" style={{ backgroundColor: "#C1694B" }}>
            <Text className="font-serif text-white text-[26px]">Calm Brain Planner</Text>
          </View>

          <Text className="italic text-[15px] mb-8 text-center" style={{ color: "#4a443b" }}>
            {mode === "signIn" ? "Welcome back." : "Create an account to sync your planner everywhere."}
          </Text>

          <View className="w-full max-w-sm">
            <Text className="text-[13px] font-semibold mb-1" style={{ color: "#6b6459" }}>
              Email
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor="#a39c8f"
              className="w-full bg-transparent border-b py-2 mb-4 text-[15px]"
              style={{ borderColor: "#D9D2C6", color: "#3A332C" }}
            />

            <Text className="text-[13px] font-semibold mb-1" style={{ color: "#6b6459" }}>
              Password
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              placeholder="••••••••"
              placeholderTextColor="#a39c8f"
              className="w-full bg-transparent border-b py-2 mb-2 text-[15px]"
              style={{ borderColor: "#D9D2C6", color: "#3A332C" }}
            />

            {!!error && (
              <Text className="text-[13px] mt-2" style={{ color: "#B3453D" }}>
                {error}
              </Text>
            )}
            {!!info && (
              <Text className="text-[13px] mt-2" style={{ color: "#7C8A57" }}>
                {info}
              </Text>
            )}

            <Pressable
              onPress={submit}
              disabled={busy}
              className="mt-6 px-7 py-3 rounded-full items-center"
              style={{ backgroundColor: "#5C5346", opacity: busy ? 0.6 : 1 }}
            >
              <Text className="text-white font-medium tracking-wide">
                {busy ? "Please wait…" : mode === "signIn" ? "Sign in" : "Sign up"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setError("");
                setInfo("");
                setMode(mode === "signIn" ? "signUp" : "signIn");
              }}
              className="mt-4 items-center"
            >
              <Text className="text-[13px] italic" style={{ color: "#8a8377" }}>
                {mode === "signIn" ? "Need an account? Sign up" : "Already have an account? Sign in"}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
