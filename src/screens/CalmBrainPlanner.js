import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import { FONT } from "../lib/globalFonts";
import { PALETTE, MONTH_NAMES, deepClone, makeDefaultData } from "../lib/plannerData";
import {
  TextLine,
  CheckRow,
  FixedCheck,
  TextArea,
  SectionHeader,
  Card,
  Crumb,
  Footer,
  PaperBackground,
} from "../components/PlannerUI";

export default function CalmBrainPlanner() {
  const { session, signOut } = useAuth();
  const userId = session?.user?.id;

  const [data, setData] = useState(makeDefaultData());
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState("cover");
  const [monthIdx, setMonthIdx] = useState(new Date().getMonth());
  const [weekIdx, setWeekIdx] = useState(0);
  const [saveState, setSaveState] = useState("idle");
  const saveTimer = useRef(null);

  // load the signed-in user's planner entry from Supabase
  useEffect(() => {
    let cancelled = false;
    if (!userId) return;
    (async () => {
      try {
        const fetchRow = supabase
          .from("planner_entries")
          .select("data")
          .eq("user_id", userId)
          .maybeSingle();
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("timed out")), 8000));
        const { data: row, error } = await Promise.race([fetchRow, timeout]);
        if (error) throw error;
        if (!cancelled && row?.data) {
          setData((d) => ({ ...d, ...row.data }));
        }
      } catch (e) {
        // no saved entry yet, a transient error, or a slow connection — start fresh
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // debounced cloud save, same "saving" / "saved" / "error" UX as the web version
  useEffect(() => {
    if (!loaded || !userId) return;
    setSaveState("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const upsert = supabase
          .from("planner_entries")
          .upsert({ user_id: userId, data, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("timed out")), 8000));
        const { error } = await Promise.race([upsert, timeout]);
        if (error) throw error;
        setSaveState("saved");
      } catch (e) {
        setSaveState("error");
      }
    }, 500);
    return () => clearTimeout(saveTimer.current);
  }, [data, loaded, userId]);

  const update = useCallback((path, value) => {
    setData((prev) => {
      const next = deepClone(prev);
      let cur = next;
      for (let i = 0; i < path.length - 1; i++) cur = cur[path[i]];
      cur[path[path.length - 1]] = value;
      return next;
    });
  }, []);

  const goHome = () => setView("dashboard");
  const pal = PALETTE[monthIdx % 5];

  if (!loaded) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F4F0E8", alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#78716c", fontSize: 13, fontStyle: "italic" }}>Loading your planner…</Text>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F4F0E8" }} edges={["top", "bottom"]}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          className="w-full max-w-3xl mx-auto"
        >
          {/* ---------------- COVER ---------------- */}
          {view === "cover" && (
            <View className="px-8 py-16 items-center" style={{ backgroundColor: "#F4F0E8" }}>
              <View className="px-6 py-4 rounded-2xl mb-6" style={{ backgroundColor: "#C1694B" }}>
                <Text className="text-white text-[30px]" style={{ fontFamily: FONT.serif }}>
                  Calm Brain Planner
                </Text>
              </View>
              <Text className="italic text-[16px] mb-2 text-center" style={{ color: "#4a443b" }}>
                Designed to reduce overwhelm in under 60 seconds.
              </Text>
              <Text className="text-[13px] mb-10 text-center" style={{ color: "#8a8377" }}>
                An ADHD-friendly planning system · Undated · Digital edition
              </Text>
              <Pressable
                onPress={() => setView("dashboard")}
                className="px-7 py-3 rounded-full"
                style={{ backgroundColor: "#5C5346" }}
              >
                <Text className="text-white font-medium tracking-wide">Open planner</Text>
              </Pressable>
              <Text className="text-[11px] mt-8" style={{ color: "#b0a99b" }}>
                Radiating Prints
              </Text>
            </View>
          )}

          {/* ---------------- START HERE ---------------- */}
          {view === "start" && (
            <View>
              <SectionHeader
                title="Start Here"
                subtitle="No decisions. Just pick the one that fits."
                accent="#C1694B"
                header="#F1E1D6"
                onBack={goHome}
              />
              <View className="p-6 flex-row flex-wrap gap-4">
                <View className="w-full sm:w-[31%]">
                  <Card title="My head is noisy" blurb="Brain dump — empty it out" accent="#6E88A0" onPress={() => setView("brainDumpGeneral")} />
                </View>
                <View className="w-full sm:w-[31%]">
                  <Card title="I'm overwhelmed" blurb="Reset toolkit — one small step" accent="#7C8A57" onPress={() => setView("overwhelm")} />
                </View>
                <View className="w-full sm:w-[31%]">
                  <Card title="I need a plan" blurb="This week — Big 3 and appointments" accent="#C1694B" onPress={() => { setWeekIdx(0); setView("week"); }} />
                </View>
              </View>
              <Text className="px-6 pb-6 text-[13px] italic" style={{ color: "#8a8377" }}>
                or tap Home above to see everything
              </Text>
              <Footer />
            </View>
          )}

          {/* ---------------- DASHBOARD ---------------- */}
          {view === "dashboard" && (
            <View>
              <View style={{ backgroundColor: "#EDE4D9", borderBottomWidth: 2, borderBottomColor: "#0000000f" }} className="px-6 pt-6 pb-5">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-[11px] uppercase tracking-wider" style={{ color: "#8a8377" }}>
                    {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : saveState === "error" ? "Couldn't save" : ""}
                  </Text>
                  <Pressable onPress={() => setView("cover")}>
                    <Text className="text-[13px] italic" style={{ color: "#8a8377" }}>Calm Brain Planner</Text>
                  </Pressable>
                </View>
                <Text className="text-[34px]" style={{ color: "#2E2A26", fontFamily: FONT.serif }}>Dashboard</Text>
                <Text className="italic text-[15px] mt-1" style={{ color: "#6b6459" }}>Where do you need help today?</Text>
              </View>
              <View className="p-6 flex-row flex-wrap gap-4">
                <View className="w-full sm:w-[31%]">
                  <Card title="Today" blurb="Do this first. That's it." accent="#C1694B" onPress={() => setView("today")} />
                </View>
                <View className="w-full sm:w-[31%]">
                  <Card title="Brain Dump" blurb="Empty your head, no sorting" accent="#6E88A0" onPress={() => setView("brainDumpGeneral")} />
                </View>
                <View className="w-full sm:w-[31%]">
                  <Card title="Reset Toolkit" blurb="Stuck? Overwhelmed? Deciding? Waiting?" accent="#7C8A57" onPress={() => setView("stuck")} />
                </View>
                <View className="w-full sm:w-[31%]">
                  <Card title="This Week" blurb="Big 3, appointments, don't forget" accent="#C1694B" onPress={() => { setWeekIdx(0); setView("week"); }} />
                </View>
                <View className="w-full sm:w-[31%]">
                  <Card title="This Month" blurb="Key dates, bills, goals" accent="#5B4A5C" onPress={() => setView("monthPicker")} />
                </View>
                <View className="w-full sm:w-[31%]">
                  <Card title="Habits" blurb="Five max. No streaks." accent="#C1694B" onPress={() => setView("habits")} />
                </View>
              </View>
              <View className="px-6 pb-2">
                <Text className="text-[13px] font-semibold mb-2" style={{ color: "#C1694B" }}>More</Text>
                <View className="flex-row flex-wrap gap-3 mb-4">
                  <View className="w-[48%] sm:w-[23%]"><Crumb label="Start Here" full onPress={() => setView("start")} /></View>
                  <View className="w-[48%] sm:w-[23%]"><Crumb label="Tiny Wins" full onPress={() => setView("tinyWins")} /></View>
                  <View className="w-[48%] sm:w-[23%]"><Crumb label="Shopping / Work / Ideas" full onPress={() => setView("lanes")} /></View>
                  <View className="w-[48%] sm:w-[23%]"><Crumb label="Notes" full onPress={() => setView("notes")} /></View>
                </View>
                <Pressable onPress={signOut} className="self-start px-3 py-1.5 rounded-full mb-2" style={{ borderWidth: 1, borderColor: "#C9C0B2" }}>
                  <Text className="text-[13px]" style={{ color: "#8a8377" }}>Log out</Text>
                </Pressable>
              </View>
              <Footer />
            </View>
          )}

          {/* ---------------- TODAY ---------------- */}
          {view === "today" && (
            <View>
              <SectionHeader title="Today" subtitle="Just today. Nothing else." accent="#C1694B" header="#F1E1D6" onBack={goHome} />
              <View className="p-6" style={{ gap: 24 }}>
                <View className="flex-row flex-wrap gap-4">
                  <View className="w-full sm:w-[47%]">
                    <Text className="text-[13px] font-semibold mb-1" style={{ color: "#C1694B" }}>I'm doing this first</Text>
                    <TextLine value={data.today.first} onChange={(v) => update(["today", "first"], v)} placeholder="One thing" />
                  </View>
                  <View className="w-full sm:w-[47%]">
                    <Text className="text-[13px] font-semibold mb-1" style={{ color: "#6b6459" }}>After that</Text>
                    <TextLine value={data.today.after} onChange={(v) => update(["today", "after"], v)} placeholder="Optional" />
                  </View>
                </View>
                <Text className="text-center italic text-[13px]" style={{ color: "#8a8377" }}>the rest — optional, in your own time</Text>
                <View className="flex-row flex-wrap gap-6">
                  <View className="w-full sm:w-[30%]">
                    <Text className="text-[13px] font-semibold mb-1" style={{ color: "#4a443b" }}>Brain dump</Text>
                    {data.today.brainDump.map((v, i) => (
                      <TextLine
                        key={i}
                        value={v}
                        onChange={(val) => {
                          const arr = [...data.today.brainDump];
                          arr[i] = val;
                          update(["today", "brainDump"], arr);
                        }}
                        placeholder="—"
                      />
                    ))}
                  </View>
                  <View className="w-full sm:w-[30%]">
                    <Text className="text-[13px] font-semibold mb-2" style={{ color: "#4a443b" }}>Time blindness</Text>
                    <Text className="text-[12px]" style={{ color: "#8a8377" }}>Thought:</Text>
                    <TextLine value={data.today.timeThought} onChange={(v) => update(["today", "timeThought"], v)} />
                    <Text className="text-[12px] mt-2" style={{ color: "#8a8377" }}>Actual:</Text>
                    <TextLine value={data.today.timeActual} onChange={(v) => update(["today", "timeActual"], v)} />
                    <Text className="text-[12px] mt-2 mb-1" style={{ color: "#8a8377" }}>Why different?</Text>
                    {Object.keys(data.today.timeWhy).map((k) => (
                      <FixedCheck
                        key={k}
                        label={k}
                        checked={data.today.timeWhy[k]}
                        accent="#C1694B"
                        onToggle={() => update(["today", "timeWhy"], { ...data.today.timeWhy, [k]: !data.today.timeWhy[k] })}
                      />
                    ))}
                  </View>
                  <View className="w-full sm:w-[30%]">
                    <Text className="text-[13px] font-semibold mb-1" style={{ color: "#4a443b" }}>Reward (after you've finished)</Text>
                    {data.today.rewards.map((item, i) => (
                      <CheckRow
                        key={i}
                        item={item}
                        accent="#C1694B"
                        placeholder="—"
                        onToggle={() => { const a = [...data.today.rewards]; a[i] = { ...a[i], checked: !a[i].checked }; update(["today", "rewards"], a); }}
                        onText={(t) => { const a = [...data.today.rewards]; a[i] = { ...a[i], text: t }; update(["today", "rewards"], a); }}
                      />
                    ))}
                  </View>
                </View>
                <View className="flex-row flex-wrap items-center gap-6 pt-4" style={{ borderTopWidth: 1, borderColor: "#E7E1D6" }}>
                  <FixedCheck label="Water" checked={data.today.water} accent="#C1694B" onToggle={() => update(["today", "water"], !data.today.water)} />
                  <FixedCheck label="Meds AM" checked={data.today.medsAM} accent="#C1694B" onToggle={() => update(["today", "medsAM"], !data.today.medsAM)} />
                  <FixedCheck label="Meds PM" checked={data.today.medsPM} accent="#C1694B" onToggle={() => update(["today", "medsPM"], !data.today.medsPM)} />
                  <View className="flex-row items-center gap-2">
                    <Text className="text-[13px]" style={{ color: "#4a443b" }}>Mood:</Text>
                    {["low", "ok", "good"].map((m) => (
                      <Pressable
                        key={m}
                        onPress={() => update(["today", "mood"], m)}
                        className="px-3 py-1 rounded-full"
                        style={{ borderWidth: 1, borderColor: data.today.mood === m ? "#C1694B" : "#C9C0B2", backgroundColor: data.today.mood === m ? "#C1694B" : "transparent" }}
                      >
                        <Text className="text-[12px] capitalize" style={{ color: data.today.mood === m ? "#fff" : "#6b6459" }}>{m}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <View>
                  <Text className="text-[13px] font-semibold mb-1" style={{ color: "#C1694B" }}>Win of the day, one line</Text>
                  <TextLine value={data.today.win} onChange={(v) => update(["today", "win"], v)} placeholder="—" />
                </View>
              </View>
              <Footer />
            </View>
          )}

          {/* ---------------- BRAIN DUMP GENERAL ---------------- */}
          {view === "brainDumpGeneral" && (
            <View>
              <SectionHeader
                title="Brain Dump — General"
                subtitle="Everything in your head. No categorising. No order. Just out."
                accent="#6E88A0" header="#E4E7E6" onBack={goHome}
                crumbs={<Crumb label="Shopping / Work / Ideas" onPress={() => setView("lanes")} />}
              />
              <View className="p-6">
                <TextArea value={data.brainDumpGeneral} onChange={(v) => update(["brainDumpGeneral"], v)} placeholder="Start typing…" rows={12} />
                <Text className="italic text-[13px] mt-4" style={{ color: "#8a8377" }}>Once it's down on paper, your brain can stop holding onto it.</Text>
              </View>
              <Footer />
            </View>
          )}

          {/* ---------------- LANES ---------------- */}
          {view === "lanes" && (
            <View>
              <SectionHeader
                title="Shopping / Work / Ideas"
                subtitle="Three quick lanes so it's still one tap, not a sub-menu"
                accent="#6E88A0" header="#E4E7E6" onBack={goHome}
                crumbs={<Crumb label="General" onPress={() => setView("brainDumpGeneral")} />}
              />
              <View className="p-6 flex-row flex-wrap gap-6">
                {["shopping", "work", "ideas"].map((k) => (
                  <View key={k} className="w-full sm:w-[30%]">
                    <Text className="text-[13px] font-semibold mb-2 capitalize" style={{ color: "#6E88A0" }}>{k}</Text>
                    <TextArea value={data.lanes[k]} onChange={(v) => update(["lanes", k], v)} rows={10} placeholder="—" />
                  </View>
                ))}
              </View>
              <Footer />
            </View>
          )}

          {/* ---------------- RESET TOOLKIT: WHY STUCK ---------------- */}
          {view === "stuck" && (
            <View>
              <SectionHeader
                title="Why am I stuck?"
                subtitle="Tick whatever fits — sometimes just naming it is enough"
                accent="#7C8A57" header="#EBE8DC" onBack={goHome}
                crumbs={<Crumb label="Overwhelm Reset" onPress={() => setView("overwhelm")} />}
              />
              <View className="p-6">
                <View className="flex-row flex-wrap gap-x-8">
                  {Object.keys(data.stuck.checks).map((k) => (
                    <View key={k} className="w-full sm:w-[45%]">
                      <FixedCheck
                        label={k}
                        checked={data.stuck.checks[k]}
                        accent="#7C8A57"
                        onToggle={() => update(["stuck", "checks"], { ...data.stuck.checks, [k]: !data.stuck.checks[k] })}
                      />
                    </View>
                  ))}
                </View>
                <View className="mt-8">
                  <Text className="text-[15px] font-semibold mb-2" style={{ color: "#7C8A57" }}>Then try</Text>
                  <TextLine value={data.stuck.then} onChange={(v) => update(["stuck", "then"], v)} placeholder="—" />
                  <Text className="italic text-[13px] mt-2" style={{ color: "#8a8377" }}>Eat, move, or leave the room — often smaller than it feels.</Text>
                </View>
              </View>
              <Footer />
            </View>
          )}

          {/* ---------------- RESET TOOLKIT: OVERWHELM ---------------- */}
          {view === "overwhelm" && (
            <View>
              <SectionHeader
                title="Overwhelm Reset"
                subtitle="One page. Answer, then let it go."
                accent="#7C8A57" header="#EBE8DC" onBack={goHome}
                crumbs={
                  <>
                    <Crumb label="Why am I stuck?" onPress={() => setView("stuck")} />
                    <Crumb label="Decision Helper" onPress={() => setView("decision")} />
                  </>
                }
              />
              <View className="p-6" style={{ gap: 24 }}>
                <View>
                  <Text className="text-[15px] font-semibold mb-1" style={{ color: "#7C8A57" }}>What is making me anxious?</Text>
                  <TextLine value={data.overwhelm.anxious} onChange={(v) => update(["overwhelm", "anxious"], v)} />
                </View>
                <View>
                  <Text className="text-[15px] font-semibold mb-2" style={{ color: "#7C8A57" }}>Can I do anything about it today?</Text>
                  <View className="flex-row gap-3">
                    {["YES", "NO"].map((opt) => (
                      <Pressable
                        key={opt}
                        onPress={() => update(["overwhelm", "canDo"], opt)}
                        className="px-8 py-3 rounded-xl"
                        style={{ borderWidth: 2, borderColor: "#7C8A57", backgroundColor: data.overwhelm.canDo === opt ? "#7C8A57" : "transparent" }}
                      >
                        <Text className="font-semibold" style={{ color: data.overwhelm.canDo === opt ? "#fff" : "#7C8A57" }}>{opt}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <Text className="italic text-[13px] mt-3" style={{ color: "#8a8377" }}>If NO — cross it out. You've done what you can with it for today.</Text>
                </View>
                <View>
                  <Text className="text-[15px] font-semibold mb-1" style={{ color: "#7C8A57" }}>One small thing that might help right now</Text>
                  <TextLine value={data.overwhelm.small} onChange={(v) => update(["overwhelm", "small"], v)} />
                  <Text className="italic text-[13px] mt-2" style={{ color: "#8a8377" }}>Water, a stretch, five minutes outside — doesn't need to be the whole fix.</Text>
                </View>
              </View>
              <Footer />
            </View>
          )}

          {/* ---------------- RESET TOOLKIT: DECISION HELPER ---------------- */}
          {view === "decision" && (
            <View>
              <SectionHeader
                title="Decision Helper"
                subtitle="Buy it? Cancel it? Say yes? Say no?"
                accent="#7C8A57" header="#EBE8DC" onBack={goHome}
                crumbs={
                  <>
                    <Crumb label="Overwhelm" onPress={() => setView("overwhelm")} />
                    <Crumb label="Waiting Mode" onPress={() => setView("waiting")} />
                  </>
                }
              />
              <View className="p-6">
                <View className="flex-row flex-wrap gap-8 mb-6">
                  <View className="w-full sm:w-[47%]">
                    <Text className="text-[15px] font-semibold mb-2" style={{ color: "#7C8A57" }}>Pros</Text>
                    <TextArea value={data.decision.pros} onChange={(v) => update(["decision", "pros"], v)} rows={7} />
                  </View>
                  <View className="w-full sm:w-[47%]">
                    <Text className="text-[15px] font-semibold mb-2" style={{ color: "#7C8A57" }}>Cons</Text>
                    <TextArea value={data.decision.cons} onChange={(v) => update(["decision", "cons"], v)} rows={7} />
                  </View>
                </View>
                <View className="flex-row flex-wrap gap-6">
                  <View className="w-full sm:w-[47%]">
                    <Text className="text-[15px] font-semibold mb-1" style={{ color: "#7C8A57" }}>Will this matter next week?</Text>
                    <TextLine value={data.decision.matter} onChange={(v) => update(["decision", "matter"], v)} />
                  </View>
                  <View className="w-full sm:w-[47%]">
                    <Text className="text-[15px] font-semibold mb-1" style={{ color: "#7C8A57" }}>Going with</Text>
                    <TextLine value={data.decision.going} onChange={(v) => update(["decision", "going"], v)} />
                  </View>
                </View>
              </View>
              <Footer />
            </View>
          )}

          {/* ---------------- RESET TOOLKIT: WAITING MODE ---------------- */}
          {view === "waiting" && (
            <View>
              <SectionHeader
                title="Waiting Mode"
                subtitle="Stuck waiting on one thing? Don't let it stall everything else."
                accent="#7C8A57" header="#EBE8DC" onBack={goHome}
                crumbs={<Crumb label="Decision Helper" onPress={() => setView("decision")} />}
              />
              <View className="p-6">
                <View className="flex-row flex-wrap gap-6 mb-6">
                  <View className="w-full sm:w-[47%]">
                    <Text className="text-[15px] font-semibold mb-1" style={{ color: "#7C8A57" }}>What I'm waiting for</Text>
                    <TextLine value={data.waiting.what} onChange={(v) => update(["waiting", "what"], v)} />
                  </View>
                  <View className="w-full sm:w-[47%]">
                    <Text className="text-[15px] font-semibold mb-1" style={{ color: "#7C8A57" }}>Roughly when</Text>
                    <TextLine value={data.waiting.when} onChange={(v) => update(["waiting", "when"], v)} />
                  </View>
                </View>
                <Text className="text-[15px] font-semibold mb-2" style={{ color: "#7C8A57" }}>Things I CAN still do before then</Text>
                {data.waiting.can.map((item, i) => (
                  <CheckRow
                    key={i}
                    item={item}
                    accent="#7C8A57"
                    placeholder="—"
                    onToggle={() => { const a = [...data.waiting.can]; a[i] = { ...a[i], checked: !a[i].checked }; update(["waiting", "can"], a); }}
                    onText={(t) => { const a = [...data.waiting.can]; a[i] = { ...a[i], text: t }; update(["waiting", "can"], a); }}
                  />
                ))}
              </View>
              <Footer />
            </View>
          )}

          {/* ---------------- HABITS ---------------- */}
          {view === "habits" && (
            <View>
              <SectionHeader title="Habits" subtitle="Five max. No streaks — reset weekly." accent="#C1694B" header="#F1E1D6" onBack={goHome} />
              <View className="p-6">
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ minWidth: 560 }}>
                    <View className="flex-row">
                      <View style={{ flex: 2, paddingBottom: 8 }}>
                        <Text className="font-semibold" style={{ color: "#C1694B" }}>Habit</Text>
                      </View>
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                        <View key={d} style={{ flex: 1, paddingBottom: 8, alignItems: "center" }}>
                          <Text className="font-semibold" style={{ color: "#C1694B" }}>{d}</Text>
                        </View>
                      ))}
                    </View>
                    {data.habits.rows.map((row, ri) => (
                      <View key={ri} className="flex-row items-center py-2" style={{ borderTopWidth: 1, borderColor: "#E7E1D6" }}>
                        <View style={{ flex: 2, paddingRight: 12 }}>
                          <TextLine
                            value={row.name}
                            onChange={(v) => { const rows = [...data.habits.rows]; rows[ri] = { ...rows[ri], name: v }; update(["habits", "rows"], rows); }}
                            placeholder="—"
                          />
                        </View>
                        {row.days.map((d, di) => (
                          <View key={di} style={{ flex: 1, alignItems: "center" }}>
                            <Pressable
                              onPress={() => {
                                const rows = [...data.habits.rows];
                                const days = [...rows[ri].days];
                                days[di] = !days[di];
                                rows[ri] = { ...rows[ri], days };
                                update(["habits", "rows"], rows);
                              }}
                              hitSlop={8}
                              className="w-5 h-5 rounded-md"
                              style={{ borderWidth: 2, borderColor: d ? "#C1694B" : "#C9C0B2", backgroundColor: d ? "#C1694B" : "transparent" }}
                            />
                          </View>
                        ))}
                      </View>
                    ))}
                  </View>
                </ScrollView>
                <Text className="italic text-[13px] mt-4" style={{ color: "#8a8377" }}>Simpler systems get maintained. Five is a ceiling, not a target.</Text>
                <View className="mt-4">
                  <Text className="text-[13px] font-semibold mb-1" style={{ color: "#C1694B" }}>Why these five right now?</Text>
                  <TextLine value={data.habits.why} onChange={(v) => update(["habits", "why"], v)} />
                </View>
              </View>
              <Footer />
            </View>
          )}

          {/* ---------------- TINY WINS ---------------- */}
          {view === "tinyWins" && (
            <View>
              <SectionHeader title="Tiny Wins" subtitle="No pressure. No gratitude. Just proof that today counted." accent="#8C7A63" header="#EDE4D9" onBack={goHome} />
              <View className="p-6 flex-row flex-wrap gap-x-8">
                {Object.keys(data.tinyWins).map((k) => (
                  <View key={k} className="w-full sm:w-[45%]">
                    <FixedCheck label={k} checked={data.tinyWins[k]} accent="#8C7A63" onToggle={() => update(["tinyWins"], { ...data.tinyWins, [k]: !data.tinyWins[k] })} />
                  </View>
                ))}
              </View>
              <Footer />
            </View>
          )}

          {/* ---------------- MONTH PICKER ---------------- */}
          {view === "monthPicker" && (
            <View>
              <SectionHeader title="This Month" subtitle="Pick a month to see key dates, bills, and goals" accent="#5B4A5C" header="#E9E2E7" onBack={goHome} />
              <View className="p-6 flex-row flex-wrap gap-3">
                {MONTH_NAMES.map((m, i) => (
                  <Pressable
                    key={m}
                    onPress={() => { setMonthIdx(i); setView("monthOverview"); }}
                    className="w-[48%] sm:w-[23%] py-6 rounded-2xl items-center"
                    style={{ backgroundColor: PALETTE[i % 5].accent }}
                  >
                    <Text className="text-white font-semibold">{m}</Text>
                  </Pressable>
                ))}
              </View>
              <Footer />
            </View>
          )}

          {/* ---------------- MONTH OVERVIEW ---------------- */}
          {view === "monthOverview" && (
            <View>
              <SectionHeader
                title={MONTH_NAMES[monthIdx]}
                subtitle="Key dates, bills, goals — not a guilt list"
                accent={pal.accent} header={pal.header} onBack={goHome}
                crumbs={<Crumb label="Choose a month" onPress={() => setView("monthPicker")} />}
              />
              <View className="p-6 flex-row flex-wrap gap-8">
                <View className="w-full sm:w-[47%]">
                  <Text className="text-[15px] font-semibold mb-2" style={{ color: pal.accent }}>Important dates</Text>
                  {data.months[monthIdx].dates.map((item, i) => (
                    <CheckRow
                      key={i} item={item} accent={pal.accent} placeholder="—"
                      onToggle={() => { const a = [...data.months[monthIdx].dates]; a[i] = { ...a[i], checked: !a[i].checked }; update(["months", monthIdx, "dates"], a); }}
                      onText={(t) => { const a = [...data.months[monthIdx].dates]; a[i] = { ...a[i], text: t }; update(["months", monthIdx, "dates"], a); }}
                    />
                  ))}
                  <Text className="text-[15px] font-semibold mt-6 mb-2" style={{ color: pal.accent }}>Bills due</Text>
                  {data.months[monthIdx].bills.map((item, i) => (
                    <CheckRow
                      key={i} item={item} accent={pal.accent} placeholder="—"
                      onToggle={() => { const a = [...data.months[monthIdx].bills]; a[i] = { ...a[i], checked: !a[i].checked }; update(["months", monthIdx, "bills"], a); }}
                      onText={(t) => { const a = [...data.months[monthIdx].bills]; a[i] = { ...a[i], text: t }; update(["months", monthIdx, "bills"], a); }}
                    />
                  ))}
                </View>
                <View className="w-full sm:w-[47%]">
                  <Text className="text-[15px] font-semibold mb-2" style={{ color: pal.accent }}>One goal (just one)</Text>
                  <TextLine value={data.months[monthIdx].goal} onChange={(v) => update(["months", monthIdx, "goal"], v)} />
                  <Text className="text-[15px] font-semibold mt-6 mb-2" style={{ color: pal.accent }}>Things to book</Text>
                  {data.months[monthIdx].book.map((item, i) => (
                    <CheckRow
                      key={i} item={item} accent={pal.accent} placeholder="—"
                      onToggle={() => { const a = [...data.months[monthIdx].book]; a[i] = { ...a[i], checked: !a[i].checked }; update(["months", monthIdx, "book"], a); }}
                      onText={(t) => { const a = [...data.months[monthIdx].book]; a[i] = { ...a[i], text: t }; update(["months", monthIdx, "book"], a); }}
                    />
                  ))}
                </View>
              </View>
              <View className="px-6 pb-6">
                <Text className="text-[15px] font-semibold mb-2" style={{ color: pal.accent }}>Notes</Text>
                <TextArea value={data.months[monthIdx].notes} onChange={(v) => update(["months", monthIdx, "notes"], v)} rows={4} />
              </View>
              <View className="px-6 pb-6">
                <Pressable
                  onPress={() => { setWeekIdx(0); setView("week"); }}
                  className="px-5 py-2.5 rounded-full self-start"
                  style={{ backgroundColor: pal.accent }}
                >
                  <Text className="text-white text-[14px] font-medium">Go to weekly pages →</Text>
                </Pressable>
              </View>
              <Footer />
            </View>
          )}

          {/* ---------------- WEEK ---------------- */}
          {view === "week" && (
            <View>
              <SectionHeader
                title={`${MONTH_NAMES[monthIdx]}: Week ${weekIdx + 1}`}
                subtitle="Not a timetable — just what actually matters this week"
                accent={pal.accent} header={pal.header} onBack={goHome}
                crumbs={
                  <>
                    <Crumb
                      label="◂ Prev"
                      onPress={() => {
                        if (weekIdx > 0) setWeekIdx(weekIdx - 1);
                        else { const m = (monthIdx + 11) % 12; setMonthIdx(m); setWeekIdx(3); }
                      }}
                    />
                    <Crumb
                      label="Next ▸"
                      onPress={() => {
                        if (weekIdx < 3) setWeekIdx(weekIdx + 1);
                        else { setMonthIdx((monthIdx + 1) % 12); setWeekIdx(0); }
                      }}
                    />
                    <Crumb label={MONTH_NAMES[monthIdx]} onPress={() => setView("monthOverview")} />
                  </>
                }
              />
              <View className="p-6">
                <View className="mb-6">
                  <Text className="italic text-[15px] font-semibold mb-1" style={{ color: pal.accent }}>If I only manage ONE thing this week…</Text>
                  <TextLine
                    value={data.months[monthIdx].weeks[weekIdx].oneThing}
                    onChange={(v) => update(["months", monthIdx, "weeks", weekIdx, "oneThing"], v)}
                  />
                </View>
                <View className="flex-row flex-wrap gap-8">
                  <View className="w-full sm:w-[47%]" style={{ gap: 24 }}>
                    <View>
                      <Text className="text-[15px] font-semibold mb-2" style={{ color: pal.accent }}>Big Three</Text>
                      {data.months[monthIdx].weeks[weekIdx].big3.map((item, i) => (
                        <CheckRow
                          key={i} item={item} accent={pal.accent} placeholder="—"
                          onToggle={() => { const a = [...data.months[monthIdx].weeks[weekIdx].big3]; a[i] = { ...a[i], checked: !a[i].checked }; update(["months", monthIdx, "weeks", weekIdx, "big3"], a); }}
                          onText={(t) => { const a = [...data.months[monthIdx].weeks[weekIdx].big3]; a[i] = { ...a[i], text: t }; update(["months", monthIdx, "weeks", weekIdx, "big3"], a); }}
                        />
                      ))}
                    </View>
                    <View>
                      <Text className="text-[15px] font-semibold mb-2" style={{ color: pal.accent }}>Appointments</Text>
                      {data.months[monthIdx].weeks[weekIdx].appts.map((item, i) => (
                        <CheckRow
                          key={i} item={item} accent={pal.accent} placeholder="—"
                          onToggle={() => { const a = [...data.months[monthIdx].weeks[weekIdx].appts]; a[i] = { ...a[i], checked: !a[i].checked }; update(["months", monthIdx, "weeks", weekIdx, "appts"], a); }}
                          onText={(t) => { const a = [...data.months[monthIdx].weeks[weekIdx].appts]; a[i] = { ...a[i], text: t }; update(["months", monthIdx, "weeks", weekIdx, "appts"], a); }}
                        />
                      ))}
                    </View>
                    <View>
                      <Text className="text-[15px] font-semibold mb-2" style={{ color: pal.accent }}>Errands / Meals</Text>
                      {data.months[monthIdx].weeks[weekIdx].errands.map((item, i) => (
                        <CheckRow
                          key={i} item={item} accent={pal.accent} placeholder="—"
                          onToggle={() => { const a = [...data.months[monthIdx].weeks[weekIdx].errands]; a[i] = { ...a[i], checked: !a[i].checked }; update(["months", monthIdx, "weeks", weekIdx, "errands"], a); }}
                          onText={(t) => { const a = [...data.months[monthIdx].weeks[weekIdx].errands]; a[i] = { ...a[i], text: t }; update(["months", monthIdx, "weeks", weekIdx, "errands"], a); }}
                        />
                      ))}
                    </View>
                  </View>
                  <View className="w-full sm:w-[47%]" style={{ gap: 24 }}>
                    <View>
                      <Text className="text-[15px] font-semibold mb-2" style={{ color: pal.accent }}>This week</Text>
                      {data.months[monthIdx].weeks[weekIdx].thisWeek.map((item, i) => (
                        <CheckRow
                          key={i} item={item} accent={pal.accent} placeholder="—"
                          onToggle={() => { const a = [...data.months[monthIdx].weeks[weekIdx].thisWeek]; a[i] = { ...a[i], checked: !a[i].checked }; update(["months", monthIdx, "weeks", weekIdx, "thisWeek"], a); }}
                          onText={(t) => { const a = [...data.months[monthIdx].weeks[weekIdx].thisWeek]; a[i] = { ...a[i], text: t }; update(["months", monthIdx, "weeks", weekIdx, "thisWeek"], a); }}
                        />
                      ))}
                    </View>
                    <View>
                      <Text className="text-[15px] font-semibold mb-2" style={{ color: pal.accent }}>Don't Forget / Brain Parking</Text>
                      {data.months[monthIdx].weeks[weekIdx].dontForget.map((item, i) => (
                        <CheckRow
                          key={i} item={item} accent={pal.accent} placeholder="—"
                          onToggle={() => { const a = [...data.months[monthIdx].weeks[weekIdx].dontForget]; a[i] = { ...a[i], checked: !a[i].checked }; update(["months", monthIdx, "weeks", weekIdx, "dontForget"], a); }}
                          onText={(t) => { const a = [...data.months[monthIdx].weeks[weekIdx].dontForget]; a[i] = { ...a[i], text: t }; update(["months", monthIdx, "weeks", weekIdx, "dontForget"], a); }}
                        />
                      ))}
                    </View>
                  </View>
                </View>
              </View>
              <Footer />
            </View>
          )}

          {/* ---------------- NOTES ---------------- */}
          {view === "notes" && (
            <View>
              <SectionHeader
                title="Notes"
                subtitle="For whatever doesn't fit anywhere else"
                accent="#6E88A0" header="#E4E7E6" onBack={goHome}
                crumbs={
                  <>
                    <Crumb label="Dot Grid" active={data.notes.style === "dot"} onPress={() => update(["notes", "style"], "dot")} />
                    <Crumb label="Lined" active={data.notes.style === "lined"} onPress={() => update(["notes", "style"], "lined")} />
                    <Crumb label="Graph" active={data.notes.style === "graph"} onPress={() => update(["notes", "style"], "graph")} />
                    <Crumb label="Blank" active={data.notes.style === "blank"} onPress={() => update(["notes", "style"], "blank")} />
                  </>
                }
              />
              <View className="p-6">
                <View style={{ position: "relative", minHeight: 420, borderRadius: 12, overflow: "hidden", backgroundColor: "#FBF9F4" }}>
                  <PaperBackground style={data.notes.style} />
                  <TextInput
                    value={data.notes.text}
                    onChangeText={(v) => update(["notes", "text"], v)}
                    placeholder="Sketch, map it out, jot it down…"
                    placeholderTextColor="#a39c8f"
                    multiline
                    textAlignVertical="top"
                    className="text-[15px] p-4"
                    style={{ color: "#3A332C", minHeight: 420 }}
                  />
                </View>
              </View>
              <Footer />
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
