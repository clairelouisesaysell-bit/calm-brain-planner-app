import "./global.css";
import { useCallback, useEffect, useState } from "react";
import { View, Text } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import {
  SourceSerif4_400Regular_Italic,
  SourceSerif4_600SemiBold,
} from "@expo-google-fonts/source-serif-4";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from "@expo-google-fonts/inter";

import { AuthProvider, useAuth } from "./src/lib/AuthContext";
import { applyGlobalFont } from "./src/lib/globalFonts";
import AuthScreen from "./src/screens/AuthScreen";
import CalmBrainPlanner from "./src/screens/CalmBrainPlanner";

SplashScreen.preventAutoHideAsync().catch(() => {});

function Gate() {
  const { session, initializing } = useAuth();

  if (initializing) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F4F0E8" }}>
        <Text style={{ color: "#78716c", fontSize: 13, fontStyle: "italic" }}>Loading your planner…</Text>
      </View>
    );
  }

  return session ? <CalmBrainPlanner /> : <AuthScreen />;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    SourceSerif4_600SemiBold,
    SourceSerif4_400Regular_Italic,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (fontsLoaded && !ready) {
      applyGlobalFont();
      setReady(true);
    }
  }, [fontsLoaded, ready]);

  const onLayout = useCallback(async () => {
    if (ready) await SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider onLayout={onLayout}>
      <AuthProvider>
        <Gate />
      </AuthProvider>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
