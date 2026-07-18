import React, { useState, useEffect, useRef, useCallback } from "react";

/* ---------- palette (cycles every 5 months, matching the original planner) ---------- */
const PALETTE = [
  { accent: "#C1694B", header: "#F1E1D6", soft: "#F6E9E2", border: "#DCB49E" }, // terracotta
  { accent: "#6E88A0", header: "#E4E7E6", soft: "#EDEFEE", border: "#B9C6CE" }, // blue-grey
  { accent: "#7C8A57", header: "#EBE8DC", soft: "#F1EFE5", border: "#C4CBA9" }, // olive
  { accent: "#8C7A63", header: "#EDE4D9", soft: "#F3ECE3", border: "#D2BFA9" }, // taupe
  { accent: "#5B4A5C", header: "#E9E2E7", soft: "#F1ECEF", border: "#C4B2C6" }, // plum
];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

/* ---------- storage helpers ---------- */
const STORAGE_KEY = "calm-brain-planner-data-v1";
const deepClone = typeof structuredClone === "function" ? structuredClone : (o) => JSON.parse(JSON.stringify(o));

function makeChecks(n) {
  return Array.from({ length: n }, () => ({ text: "", checked: false }));
}
function makeDefaultData() {
  return {
    today: {
      first: "", after: "",
      brainDump: ["", "", "", ""],
      timeThought: "", timeActual: "",
      timeWhy: { Interruptions: false, Perfectionism: false, Phone: false, Waiting: false, Hyperfocus: false },
      rewards: makeChecks(5),
      water: false, medsAM: false, medsPM: false, mood: "",
      win: "",
    },
    brainDumpGeneral: "",
    lanes: { shopping: "", work: "", ideas: "" },
    stuck: {
      checks: { Hungry: false, Overstimulated: false, "Avoiding a task": false, Tired: false, "Decision fatigue": false, Hormones: false, "Too many notifications": false, "Something else": false },
      then: "",
    },
    overwhelm: { anxious: "", canDo: null, small: "" },
    decision: { pros: "", cons: "", matter: "", going: "" },
    waiting: { what: "", when: "", can: makeChecks(8) },
    habits: {
      rows: Array.from({ length: 5 }, () => ({ name: "", days: [false, false, false, false, false, false, false] })),
      why: "",
    },
    tinyWins: {
      Showered: false, "Got dressed": false, "Left the house": false, "Replied to a message": false,
      "Answered an email": false, "Drank water": false, "Ate something": false, "Something I'm proud of": false,
    },
    months: Array.from({ length: 12 }, () => ({
      dates: makeChecks(5), bills: makeChecks(4), goal: "", book: makeChecks(5), notes: "",
      weeks: Array.from({ length: 4 }, () => ({
        oneThing: "", big3: makeChecks(3), appts: makeChecks(3), errands: makeChecks(3),
        thisWeek: makeChecks(6), dontForget: makeChecks(6),
      })),
    })),
    notes: { style: "dot", text: "" },
  };
}

/* ---------- small reusable bits ---------- */
function TextLine({ value, onChange, placeholder, accent }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-transparent border-b py-1.5 outline-none text-[15px] placeholder:text-stone-400 focus:border-current transition-colors"
      style={{ borderColor: "#D9D2C6", color: "#3A332C" }}
    />
  );
}

function CheckRow({ item, onToggle, onText, accent, placeholder }) {
  return (
    <label className="flex items-center gap-3 py-1.5 cursor-pointer group">
      <span
        onClick={(e) => { e.preventDefault(); onToggle(); }}
        className="w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-colors"
        style={{ borderColor: item.checked ? accent : "#C9C0B2", background: item.checked ? accent : "transparent" }}
      >
        {item.checked && <span className="text-white text-[11px] leading-none">✓</span>}
      </span>
      <input
        value={item.text}
        onChange={(e) => onText(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent border-b py-1 outline-none text-[15px] placeholder:text-stone-400 focus:border-current"
        style={{ borderColor: "#D9D2C6", color: item.checked ? "#8a8377" : "#3A332C", textDecoration: item.checked ? "line-through" : "none" }}
      />
    </label>
  );
}

function FixedCheck({ label, checked, onToggle, accent }) {
  return (
    <label className="flex items-center gap-3 py-1.5 cursor-pointer">
      <span
        onClick={(e) => { e.preventDefault(); onToggle(); }}
        className="w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-colors"
        style={{ borderColor: checked ? accent : "#C9C0B2", background: checked ? accent : "transparent" }}
      >
        {checked && <span className="text-white text-[11px] leading-none">✓</span>}
      </span>
      <span className="text-[15px]" style={{ color: checked ? "#8a8377" : "#3A332C", textDecoration: checked ? "line-through" : "none" }}>{label}</span>
    </label>
  );
}

function TextArea({ value, onChange, placeholder, rows = 6 }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-transparent outline-none text-[15px] placeholder:text-stone-400 resize-none leading-8"
      style={{
        color: "#3A332C",
        backgroundImage: "repeating-linear-gradient(to bottom, transparent, transparent 31px, #DED6C8 32px)",
      }}
    />
  );
}

function SectionHeader({ eyebrow, title, subtitle, accent, header, onBack, backLabel, crumbs }) {
  return (
    <div style={{ background: header }} className="px-6 pt-6 pb-5 border-b-2" >
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="px-3 py-1.5 rounded-full text-white text-[13px] font-medium tracking-wide"
            style={{ background: "#5C5346" }}
          >
            Home
          </button>
          {crumbs}
        </div>
        {eyebrow && <span className="text-[13px] italic" style={{ color: "#6b6459" }}>{eyebrow}</span>}
      </div>
      <h1 className="font-serif text-[34px] leading-tight" style={{ color: "#2E2A26" }}>{title}</h1>
      {subtitle && <p className="italic text-[15px] mt-1" style={{ color: "#6b6459" }}>{subtitle}</p>}
      <div className="h-[3px] w-full mt-5 rounded-full" style={{ background: accent }} />
    </div>
  );
}

function Card({ title, blurb, accent, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-left bg-white rounded-2xl p-5 border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
      style={{ borderColor: "#E7E1D6" }}
    >
      <div className="font-serif text-[19px] mb-3" style={{ color: accent }}>{title}</div>
      <div className="text-[13px] rounded-lg px-3 py-2" style={{ background: "#F1ECE3", color: "#6b6459" }}>{blurb}</div>
    </button>
  );
}

function Crumb({ label, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-[13px] border"
      style={{ borderColor: active ? "#5C5346" : "#C9C0B2", color: active ? "#3A332C" : "#6b6459", background: active ? "#EAE4D8" : "transparent" }}
    >
      {label}
    </button>
  );
}

function Footer() {
  return (
    <div className="px-6 py-4 flex items-center justify-between text-[12px]" style={{ color: "#9c9587", background: "#F4F0E8" }}>
      <span>Radiating Prints</span>
      <span className="hidden sm:inline">tap Home to return to the dashboard</span>
      <span>© 2026 Radiating Prints</span>
    </div>
  );
}

/* ---------- app ---------- */
export default function CalmBrainPlanner() {
  const [data, setData] = useState(makeDefaultData());
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState("cover");
  const [monthIdx, setMonthIdx] = useState(new Date().getMonth());
  const [weekIdx, setWeekIdx] = useState(0);
  const [saveState, setSaveState] = useState("idle");
  const saveTimer = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setData((d) => ({ ...d, ...parsed }));
      }
    } catch (e) {
      // no saved data yet, or storage unavailable — start fresh
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    setSaveState("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        setSaveState("saved");
      } catch (e) {
        setSaveState("error");
      }
    }, 500);
    return () => clearTimeout(saveTimer.current);
  }, [data, loaded]);

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F4F0E8", fontFamily: "'Source Serif 4', Georgia, serif" }}>
        <div className="text-stone-500 text-sm italic">Loading your planner…</div>
      </div>
    );
  }

  return (
    <div style={{ background: "#F4F0E8", minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="max-w-3xl mx-auto my-0 sm:my-8 bg-[#F4F0E8] sm:rounded-3xl overflow-hidden sm:shadow-xl" style={{ border: "1px solid #E7E1D6" }}>

        {/* ---------------- COVER ---------------- */}
        {view === "cover" && (
          <div className="relative px-8 py-16 text-center" style={{ background: "#F4F0E8" }}>
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-40" style={{ background: "#7C1F3E10" }} />
            <div className="inline-block px-6 py-4 rounded-2xl shadow-md mb-6" style={{ background: "#C1694B" }}>
              <h1 className="font-serif text-white text-[30px]">Calm Brain Planner</h1>
            </div>
            <p className="italic text-[16px] mb-2" style={{ color: "#4a443b" }}>Designed to reduce overwhelm in under 60 seconds.</p>
            <p className="text-[13px] mb-10" style={{ color: "#8a8377" }}>An ADHD-friendly planning system · Undated · Digital edition</p>
            <button
              onClick={() => setView("dashboard")}
              className="px-7 py-3 rounded-full text-white font-medium tracking-wide shadow-sm"
              style={{ background: "#5C5346" }}
            >
              Open planner
            </button>
            <div className="text-[11px] mt-8" style={{ color: "#b0a99b" }}>Radiating Prints</div>
          </div>
        )}

        {/* ---------------- START HERE ---------------- */}
        {view === "start" && (
          <div>
            <SectionHeader title="Start Here" subtitle="No decisions. Just pick the one that fits." accent="#C1694B" header="#F1E1D6" onBack={goHome} />
            <div className="p-6 grid sm:grid-cols-3 gap-4">
              <Card title="My head is noisy" blurb="Brain dump — empty it out" accent="#6E88A0" onClick={() => setView("brainDumpGeneral")} />
              <Card title="I'm overwhelmed" blurb="Reset toolkit — one small step" accent="#7C8A57" onClick={() => setView("overwhelm")} />
              <Card title="I need a plan" blurb="This week — Big 3 and appointments" accent="#C1694B" onClick={() => { setWeekIdx(0); setView("week"); }} />
            </div>
            <p className="px-6 pb-6 text-[13px] italic" style={{ color: "#8a8377" }}>or tap Home above to see everything</p>
            <Footer />
          </div>
        )}

        {/* ---------------- DASHBOARD ---------------- */}
        {view === "dashboard" && (
          <div>
            <div style={{ background: "#EDE4D9" }} className="px-6 pt-6 pb-5 border-b-2" >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] uppercase tracking-wider" style={{ color: "#8a8377" }}>
                  {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : ""}
                </span>
                <button onClick={() => setView("cover")} className="text-[13px] italic" style={{ color: "#8a8377" }}>Calm Brain Planner</button>
              </div>
              <h1 className="font-serif text-[34px]" style={{ color: "#2E2A26" }}>Dashboard</h1>
              <p className="italic text-[15px] mt-1" style={{ color: "#6b6459" }}>Where do you need help today?</p>
            </div>
            <div className="p-6 grid sm:grid-cols-3 gap-4">
              <Card title="Today" blurb="Do this first. That's it." accent="#C1694B" onClick={() => setView("today")} />
              <Card title="Brain Dump" blurb="Empty your head, no sorting" accent="#6E88A0" onClick={() => setView("brainDumpGeneral")} />
              <Card title="Reset Toolkit" blurb="Stuck? Overwhelmed? Deciding? Waiting?" accent="#7C8A57" onClick={() => setView("stuck")} />
              <Card title="This Week" blurb="Big 3, appointments, don't forget" accent="#C1694B" onClick={() => { setWeekIdx(0); setView("week"); }} />
              <Card title="This Month" blurb="Key dates, bills, goals" accent="#5B4A5C" onClick={() => setView("monthPicker")} />
              <Card title="Habits" blurb="Five max. No streaks." accent="#C1694B" onClick={() => setView("habits")} />
            </div>
            <div className="px-6 pb-2">
              <div className="text-[13px] font-semibold mb-2" style={{ color: "#C1694B" }}>More</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <Crumb label="Start Here" onClick={() => setView("start")} />
                <Crumb label="Tiny Wins" onClick={() => setView("tinyWins")} />
                <Crumb label="Shopping / Work / Ideas" onClick={() => setView("lanes")} />
                <Crumb label="Notes" onClick={() => setView("notes")} />
              </div>
            </div>
            <Footer />
          </div>
        )}

        {/* ---------------- TODAY ---------------- */}
        {view === "today" && (
          <div>
            <SectionHeader title="Today" subtitle="Just today. Nothing else." accent="#C1694B" header="#F1E1D6" onBack={goHome} />
            <div className="p-6 space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-[13px] font-semibold mb-1" style={{ color: "#C1694B" }}>I'm doing this first</div>
                  <TextLine value={data.today.first} onChange={(v) => update(["today", "first"], v)} placeholder="One thing" accent="#C1694B" />
                </div>
                <div>
                  <div className="text-[13px] font-semibold mb-1" style={{ color: "#6b6459" }}>After that</div>
                  <TextLine value={data.today.after} onChange={(v) => update(["today", "after"], v)} placeholder="Optional" accent="#C1694B" />
                </div>
              </div>
              <p className="text-center italic text-[13px]" style={{ color: "#8a8377" }}>the rest — optional, in your own time</p>
              <div className="grid sm:grid-cols-3 gap-6">
                <div>
                  <div className="text-[13px] font-semibold mb-1" style={{ color: "#4a443b" }}>Brain dump</div>
                  {data.today.brainDump.map((v, i) => (
                    <TextLine key={i} value={v} onChange={(val) => {
                      const arr = [...data.today.brainDump]; arr[i] = val; update(["today", "brainDump"], arr);
                    }} placeholder="—" accent="#C1694B" />
                  ))}
                </div>
                <div>
                  <div className="text-[13px] font-semibold mb-2" style={{ color: "#4a443b" }}>Time blindness</div>
                  <label className="text-[12px]" style={{ color: "#8a8377" }}>Thought:</label>
                  <TextLine value={data.today.timeThought} onChange={(v) => update(["today", "timeThought"], v)} placeholder="" accent="#C1694B" />
                  <label className="text-[12px]" style={{ color: "#8a8377" }}>Actual:</label>
                  <TextLine value={data.today.timeActual} onChange={(v) => update(["today", "timeActual"], v)} placeholder="" accent="#C1694B" />
                  <div className="text-[12px] mt-2 mb-1" style={{ color: "#8a8377" }}>Why different?</div>
                  {Object.keys(data.today.timeWhy).map((k) => (
                    <FixedCheck key={k} label={k} checked={data.today.timeWhy[k]} accent="#C1694B"
                      onToggle={() => update(["today", "timeWhy"], { ...data.today.timeWhy, [k]: !data.today.timeWhy[k] })} />
                  ))}
                </div>
                <div>
                  <div className="text-[13px] font-semibold mb-1" style={{ color: "#4a443b" }}>Reward (after you've finished)</div>
                  {data.today.rewards.map((item, i) => (
                    <CheckRow key={i} item={item} accent="#C1694B" placeholder="—"
                      onToggle={() => { const a = [...data.today.rewards]; a[i] = { ...a[i], checked: !a[i].checked }; update(["today", "rewards"], a); }}
                      onText={(t) => { const a = [...data.today.rewards]; a[i] = { ...a[i], text: t }; update(["today", "rewards"], a); }} />
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-6 pt-4 border-t" style={{ borderColor: "#E7E1D6" }}>
                <FixedCheck label="Water" checked={data.today.water} accent="#C1694B" onToggle={() => update(["today", "water"], !data.today.water)} />
                <FixedCheck label="Meds AM" checked={data.today.medsAM} accent="#C1694B" onToggle={() => update(["today", "medsAM"], !data.today.medsAM)} />
                <FixedCheck label="Meds PM" checked={data.today.medsPM} accent="#C1694B" onToggle={() => update(["today", "medsPM"], !data.today.medsPM)} />
                <div className="flex items-center gap-2">
                  <span className="text-[13px]" style={{ color: "#4a443b" }}>Mood:</span>
                  {["low", "ok", "good"].map((m) => (
                    <button key={m} onClick={() => update(["today", "mood"], m)}
                      className="px-3 py-1 rounded-full text-[12px] border capitalize"
                      style={{ borderColor: data.today.mood === m ? "#C1694B" : "#C9C0B2", background: data.today.mood === m ? "#C1694B" : "transparent", color: data.today.mood === m ? "#fff" : "#6b6459" }}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[13px] font-semibold mb-1" style={{ color: "#C1694B" }}>Win of the day, one line</div>
                <TextLine value={data.today.win} onChange={(v) => update(["today", "win"], v)} placeholder="—" accent="#C1694B" />
              </div>
            </div>
            <Footer />
          </div>
        )}

        {/* ---------------- BRAIN DUMP GENERAL ---------------- */}
        {view === "brainDumpGeneral" && (
          <div>
            <SectionHeader title="Brain Dump — General" subtitle="Everything in your head. No categorising. No order. Just out." accent="#6E88A0" header="#E4E7E6" onBack={goHome}
              crumbs={<Crumb label="Shopping / Work / Ideas" onClick={() => setView("lanes")} />} />
            <div className="p-6">
              <TextArea value={data.brainDumpGeneral} onChange={(v) => update(["brainDumpGeneral"], v)} placeholder="Start typing…" rows={12} />
              <p className="italic text-[13px] mt-4" style={{ color: "#8a8377" }}>Once it's down on paper, your brain can stop holding onto it.</p>
            </div>
            <Footer />
          </div>
        )}

        {/* ---------------- LANES ---------------- */}
        {view === "lanes" && (
          <div>
            <SectionHeader title="Shopping / Work / Ideas" subtitle="Three quick lanes so it's still one tap, not a sub-menu" accent="#6E88A0" header="#E4E7E6" onBack={goHome}
              crumbs={<Crumb label="General" onClick={() => setView("brainDumpGeneral")} />} />
            <div className="p-6 grid sm:grid-cols-3 gap-6">
              {["shopping", "work", "ideas"].map((k) => (
                <div key={k}>
                  <div className="text-[13px] font-semibold mb-2 capitalize" style={{ color: "#6E88A0" }}>{k}</div>
                  <TextArea value={data.lanes[k]} onChange={(v) => update(["lanes", k], v)} rows={10} placeholder="—" />
                </div>
              ))}
            </div>
            <Footer />
          </div>
        )}

        {/* ---------------- RESET TOOLKIT: WHY STUCK ---------------- */}
        {view === "stuck" && (
          <div>
            <SectionHeader title="Why am I stuck?" subtitle="Tick whatever fits — sometimes just naming it is enough" accent="#7C8A57" header="#EBE8DC" onBack={goHome}
              crumbs={<Crumb label="Overwhelm Reset" onClick={() => setView("overwhelm")} />} />
            <div className="p-6">
              <div className="grid sm:grid-cols-2 gap-x-8">
                {Object.keys(data.stuck.checks).map((k) => (
                  <FixedCheck key={k} label={k} checked={data.stuck.checks[k]} accent="#7C8A57"
                    onToggle={() => update(["stuck", "checks"], { ...data.stuck.checks, [k]: !data.stuck.checks[k] })} />
                ))}
              </div>
              <div className="mt-8">
                <div className="text-[15px] font-semibold mb-2" style={{ color: "#7C8A57" }}>Then try</div>
                <TextLine value={data.stuck.then} onChange={(v) => update(["stuck", "then"], v)} placeholder="—" accent="#7C8A57" />
                <p className="italic text-[13px] mt-2" style={{ color: "#8a8377" }}>Eat, move, or leave the room — often smaller than it feels.</p>
              </div>
            </div>
            <Footer />
          </div>
        )}

        {/* ---------------- RESET TOOLKIT: OVERWHELM ---------------- */}
        {view === "overwhelm" && (
          <div>
            <SectionHeader title="Overwhelm Reset" subtitle="One page. Answer, then let it go." accent="#7C8A57" header="#EBE8DC" onBack={goHome}
              crumbs={<>
                <Crumb label="Why am I stuck?" onClick={() => setView("stuck")} />
                <Crumb label="Decision Helper" onClick={() => setView("decision")} />
              </>} />
            <div className="p-6 space-y-6">
              <div>
                <div className="text-[15px] font-semibold mb-1" style={{ color: "#7C8A57" }}>What is making me anxious?</div>
                <TextLine value={data.overwhelm.anxious} onChange={(v) => update(["overwhelm", "anxious"], v)} accent="#7C8A57" />
              </div>
              <div>
                <div className="text-[15px] font-semibold mb-2" style={{ color: "#7C8A57" }}>Can I do anything about it today?</div>
                <div className="flex gap-3">
                  {["YES", "NO"].map((opt) => (
                    <button key={opt} onClick={() => update(["overwhelm", "canDo"], opt)}
                      className="px-8 py-3 rounded-xl border-2 font-semibold"
                      style={{ borderColor: "#7C8A57", background: data.overwhelm.canDo === opt ? "#7C8A57" : "transparent", color: data.overwhelm.canDo === opt ? "#fff" : "#7C8A57" }}>
                      {opt}
                    </button>
                  ))}
                </div>
                <p className="italic text-[13px] mt-3" style={{ color: "#8a8377" }}>If NO — cross it out. You've done what you can with it for today.</p>
              </div>
              <div>
                <div className="text-[15px] font-semibold mb-1" style={{ color: "#7C8A57" }}>One small thing that might help right now</div>
                <TextLine value={data.overwhelm.small} onChange={(v) => update(["overwhelm", "small"], v)} accent="#7C8A57" />
                <p className="italic text-[13px] mt-2" style={{ color: "#8a8377" }}>Water, a stretch, five minutes outside — doesn't need to be the whole fix.</p>
              </div>
            </div>
            <Footer />
          </div>
        )}

        {/* ---------------- RESET TOOLKIT: DECISION HELPER ---------------- */}
        {view === "decision" && (
          <div>
            <SectionHeader title="Decision Helper" subtitle="Buy it? Cancel it? Say yes? Say no?" accent="#7C8A57" header="#EBE8DC" onBack={goHome}
              crumbs={<>
                <Crumb label="Overwhelm" onClick={() => setView("overwhelm")} />
                <Crumb label="Waiting Mode" onClick={() => setView("waiting")} />
              </>} />
            <div className="p-6">
              <div className="grid sm:grid-cols-2 gap-8 mb-6">
                <div>
                  <div className="text-[15px] font-semibold mb-2" style={{ color: "#7C8A57" }}>Pros</div>
                  <TextArea value={data.decision.pros} onChange={(v) => update(["decision", "pros"], v)} rows={7} />
                </div>
                <div>
                  <div className="text-[15px] font-semibold mb-2" style={{ color: "#7C8A57" }}>Cons</div>
                  <TextArea value={data.decision.cons} onChange={(v) => update(["decision", "cons"], v)} rows={7} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <div className="text-[15px] font-semibold mb-1" style={{ color: "#7C8A57" }}>Will this matter next week?</div>
                  <TextLine value={data.decision.matter} onChange={(v) => update(["decision", "matter"], v)} accent="#7C8A57" />
                </div>
                <div>
                  <div className="text-[15px] font-semibold mb-1" style={{ color: "#7C8A57" }}>Going with</div>
                  <TextLine value={data.decision.going} onChange={(v) => update(["decision", "going"], v)} accent="#7C8A57" />
                </div>
              </div>
            </div>
            <Footer />
          </div>
        )}

        {/* ---------------- RESET TOOLKIT: WAITING MODE ---------------- */}
        {view === "waiting" && (
          <div>
            <SectionHeader title="Waiting Mode" subtitle="Stuck waiting on one thing? Don't let it stall everything else." accent="#7C8A57" header="#EBE8DC" onBack={goHome}
              crumbs={<Crumb label="Decision Helper" onClick={() => setView("decision")} />} />
            <div className="p-6">
              <div className="grid sm:grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="text-[15px] font-semibold mb-1" style={{ color: "#7C8A57" }}>What I'm waiting for</div>
                  <TextLine value={data.waiting.what} onChange={(v) => update(["waiting", "what"], v)} accent="#7C8A57" />
                </div>
                <div>
                  <div className="text-[15px] font-semibold mb-1" style={{ color: "#7C8A57" }}>Roughly when</div>
                  <TextLine value={data.waiting.when} onChange={(v) => update(["waiting", "when"], v)} accent="#7C8A57" />
                </div>
              </div>
              <div className="text-[15px] font-semibold mb-2" style={{ color: "#7C8A57" }}>Things I CAN still do before then</div>
              {data.waiting.can.map((item, i) => (
                <CheckRow key={i} item={item} accent="#7C8A57" placeholder="—"
                  onToggle={() => { const a = [...data.waiting.can]; a[i] = { ...a[i], checked: !a[i].checked }; update(["waiting", "can"], a); }}
                  onText={(t) => { const a = [...data.waiting.can]; a[i] = { ...a[i], text: t }; update(["waiting", "can"], a); }} />
              ))}
            </div>
            <Footer />
          </div>
        )}

        {/* ---------------- HABITS ---------------- */}
        {view === "habits" && (
          <div>
            <SectionHeader title="Habits" subtitle="Five max. No streaks — reset weekly." accent="#C1694B" header="#F1E1D6" onBack={goHome} />
            <div className="p-6 overflow-x-auto">
              <table className="w-full text-[14px] min-w-[560px]">
                <thead>
                  <tr>
                    <th className="text-left pb-2 font-semibold" style={{ color: "#C1694B" }}>Habit</th>
                    {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
                      <th key={d} className="pb-2 font-semibold text-center" style={{ color: "#C1694B" }}>{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.habits.rows.map((row, ri) => (
                    <tr key={ri} className="border-t" style={{ borderColor: "#E7E1D6" }}>
                      <td className="py-2 pr-3">
                        <TextLine value={row.name} onChange={(v) => {
                          const rows = [...data.habits.rows]; rows[ri] = { ...rows[ri], name: v }; update(["habits", "rows"], rows);
                        }} placeholder="—" accent="#C1694B" />
                      </td>
                      {row.days.map((d, di) => (
                        <td key={di} className="text-center py-2">
                          <span
                            onClick={() => {
                              const rows = [...data.habits.rows];
                              const days = [...rows[ri].days]; days[di] = !days[di];
                              rows[ri] = { ...rows[ri], days }; update(["habits", "rows"], rows);
                            }}
                            className="inline-block w-5 h-5 rounded-md border-2 cursor-pointer"
                            style={{ borderColor: d ? "#C1694B" : "#C9C0B2", background: d ? "#C1694B" : "transparent" }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="italic text-[13px] mt-4" style={{ color: "#8a8377" }}>Simpler systems get maintained. Five is a ceiling, not a target.</p>
              <div className="mt-4">
                <div className="text-[13px] font-semibold mb-1" style={{ color: "#C1694B" }}>Why these five right now?</div>
                <TextLine value={data.habits.why} onChange={(v) => update(["habits", "why"], v)} accent="#C1694B" />
              </div>
            </div>
            <Footer />
          </div>
        )}

        {/* ---------------- TINY WINS ---------------- */}
        {view === "tinyWins" && (
          <div>
            <SectionHeader title="Tiny Wins" subtitle="No pressure. No gratitude. Just proof that today counted." accent="#8C7A63" header="#EDE4D9" onBack={goHome} />
            <div className="p-6 grid sm:grid-cols-2 gap-x-8">
              {Object.keys(data.tinyWins).map((k) => (
                <FixedCheck key={k} label={k} checked={data.tinyWins[k]} accent="#8C7A63"
                  onToggle={() => update(["tinyWins"], { ...data.tinyWins, [k]: !data.tinyWins[k] })} />
              ))}
            </div>
            <Footer />
          </div>
        )}

        {/* ---------------- MONTH PICKER ---------------- */}
        {view === "monthPicker" && (
          <div>
            <SectionHeader title="This Month" subtitle="Pick a month to see key dates, bills, and goals" accent="#5B4A5C" header="#E9E2E7" onBack={goHome} />
            <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {MONTH_NAMES.map((m, i) => (
                <button key={m} onClick={() => { setMonthIdx(i); setView("monthOverview"); }}
                  className="py-6 rounded-2xl text-white font-semibold shadow-sm"
                  style={{ background: PALETTE[i % 5].accent }}>
                  {m}
                </button>
              ))}
            </div>
            <Footer />
          </div>
        )}

        {/* ---------------- MONTH OVERVIEW ---------------- */}
        {view === "monthOverview" && (
          <div>
            <SectionHeader title={MONTH_NAMES[monthIdx]} subtitle="Key dates, bills, goals — not a guilt list" accent={pal.accent} header={pal.header} onBack={goHome}
              crumbs={<Crumb label="Choose a month" onClick={() => setView("monthPicker")} />} />
            <div className="p-6 grid sm:grid-cols-2 gap-8">
              <div>
                <div className="text-[15px] font-semibold mb-2" style={{ color: pal.accent }}>Important dates</div>
                {data.months[monthIdx].dates.map((item, i) => (
                  <CheckRow key={i} item={item} accent={pal.accent} placeholder="—"
                    onToggle={() => { const a = [...data.months[monthIdx].dates]; a[i] = { ...a[i], checked: !a[i].checked }; update(["months", monthIdx, "dates"], a); }}
                    onText={(t) => { const a = [...data.months[monthIdx].dates]; a[i] = { ...a[i], text: t }; update(["months", monthIdx, "dates"], a); }} />
                ))}
                <div className="text-[15px] font-semibold mt-6 mb-2" style={{ color: pal.accent }}>Bills due</div>
                {data.months[monthIdx].bills.map((item, i) => (
                  <CheckRow key={i} item={item} accent={pal.accent} placeholder="—"
                    onToggle={() => { const a = [...data.months[monthIdx].bills]; a[i] = { ...a[i], checked: !a[i].checked }; update(["months", monthIdx, "bills"], a); }}
                    onText={(t) => { const a = [...data.months[monthIdx].bills]; a[i] = { ...a[i], text: t }; update(["months", monthIdx, "bills"], a); }} />
                ))}
              </div>
              <div>
                <div className="text-[15px] font-semibold mb-2" style={{ color: pal.accent }}>One goal (just one)</div>
                <TextLine value={data.months[monthIdx].goal} onChange={(v) => update(["months", monthIdx, "goal"], v)} accent={pal.accent} />
                <div className="text-[15px] font-semibold mt-6 mb-2" style={{ color: pal.accent }}>Things to book</div>
                {data.months[monthIdx].book.map((item, i) => (
                  <CheckRow key={i} item={item} accent={pal.accent} placeholder="—"
                    onToggle={() => { const a = [...data.months[monthIdx].book]; a[i] = { ...a[i], checked: !a[i].checked }; update(["months", monthIdx, "book"], a); }}
                    onText={(t) => { const a = [...data.months[monthIdx].book]; a[i] = { ...a[i], text: t }; update(["months", monthIdx, "book"], a); }} />
                ))}
              </div>
            </div>
            <div className="px-6 pb-6">
              <div className="text-[15px] font-semibold mb-2" style={{ color: pal.accent }}>Notes</div>
              <TextArea value={data.months[monthIdx].notes} onChange={(v) => update(["months", monthIdx, "notes"], v)} rows={4} />
            </div>
            <div className="px-6 pb-6">
              <button onClick={() => { setWeekIdx(0); setView("week"); }}
                className="px-5 py-2.5 rounded-full text-white text-[14px] font-medium" style={{ background: pal.accent }}>
                Go to weekly pages →
              </button>
            </div>
            <Footer />
          </div>
        )}

        {/* ---------------- WEEK ---------------- */}
        {view === "week" && (
          <div>
            <SectionHeader
              title={`${MONTH_NAMES[monthIdx]}: Week ${weekIdx + 1}`}
              subtitle="Not a timetable — just what actually matters this week"
              accent={pal.accent} header={pal.header} onBack={goHome}
              crumbs={<>
                <Crumb label="◂ Prev" onClick={() => {
                  if (weekIdx > 0) setWeekIdx(weekIdx - 1);
                  else { const m = (monthIdx + 11) % 12; setMonthIdx(m); setWeekIdx(3); }
                }} />
                <Crumb label="Next ▸" onClick={() => {
                  if (weekIdx < 3) setWeekIdx(weekIdx + 1);
                  else { setMonthIdx((monthIdx + 1) % 12); setWeekIdx(0); }
                }} />
                <Crumb label={MONTH_NAMES[monthIdx]} onClick={() => setView("monthOverview")} />
              </>}
            />
            <div className="p-6">
              <div className="mb-6">
                <div className="italic text-[15px] font-semibold mb-1" style={{ color: pal.accent }}>If I only manage ONE thing this week…</div>
                <TextLine value={data.months[monthIdx].weeks[weekIdx].oneThing}
                  onChange={(v) => update(["months", monthIdx, "weeks", weekIdx, "oneThing"], v)} accent={pal.accent} />
              </div>
              <div className="grid sm:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <div className="text-[15px] font-semibold mb-2" style={{ color: pal.accent }}>Big Three</div>
                    {data.months[monthIdx].weeks[weekIdx].big3.map((item, i) => (
                      <CheckRow key={i} item={item} accent={pal.accent} placeholder="—"
                        onToggle={() => { const a = [...data.months[monthIdx].weeks[weekIdx].big3]; a[i] = { ...a[i], checked: !a[i].checked }; update(["months", monthIdx, "weeks", weekIdx, "big3"], a); }}
                        onText={(t) => { const a = [...data.months[monthIdx].weeks[weekIdx].big3]; a[i] = { ...a[i], text: t }; update(["months", monthIdx, "weeks", weekIdx, "big3"], a); }} />
                    ))}
                  </div>
                  <div>
                    <div className="text-[15px] font-semibold mb-2" style={{ color: pal.accent }}>Appointments</div>
                    {data.months[monthIdx].weeks[weekIdx].appts.map((item, i) => (
                      <CheckRow key={i} item={item} accent={pal.accent} placeholder="—"
                        onToggle={() => { const a = [...data.months[monthIdx].weeks[weekIdx].appts]; a[i] = { ...a[i], checked: !a[i].checked }; update(["months", monthIdx, "weeks", weekIdx, "appts"], a); }}
                        onText={(t) => { const a = [...data.months[monthIdx].weeks[weekIdx].appts]; a[i] = { ...a[i], text: t }; update(["months", monthIdx, "weeks", weekIdx, "appts"], a); }} />
                    ))}
                  </div>
                  <div>
                    <div className="text-[15px] font-semibold mb-2" style={{ color: pal.accent }}>Errands / Meals</div>
                    {data.months[monthIdx].weeks[weekIdx].errands.map((item, i) => (
                      <CheckRow key={i} item={item} accent={pal.accent} placeholder="—"
                        onToggle={() => { const a = [...data.months[monthIdx].weeks[weekIdx].errands]; a[i] = { ...a[i], checked: !a[i].checked }; update(["months", monthIdx, "weeks", weekIdx, "errands"], a); }}
                        onText={(t) => { const a = [...data.months[monthIdx].weeks[weekIdx].errands]; a[i] = { ...a[i], text: t }; update(["months", monthIdx, "weeks", weekIdx, "errands"], a); }} />
                    ))}
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <div className="text-[15px] font-semibold mb-2" style={{ color: pal.accent }}>This week</div>
                    {data.months[monthIdx].weeks[weekIdx].thisWeek.map((item, i) => (
                      <CheckRow key={i} item={item} accent={pal.accent} placeholder="—"
                        onToggle={() => { const a = [...data.months[monthIdx].weeks[weekIdx].thisWeek]; a[i] = { ...a[i], checked: !a[i].checked }; update(["months", monthIdx, "weeks", weekIdx, "thisWeek"], a); }}
                        onText={(t) => { const a = [...data.months[monthIdx].weeks[weekIdx].thisWeek]; a[i] = { ...a[i], text: t }; update(["months", monthIdx, "weeks", weekIdx, "thisWeek"], a); }} />
                    ))}
                  </div>
                  <div>
                    <div className="text-[15px] font-semibold mb-2" style={{ color: pal.accent }}>Don't Forget / Brain Parking</div>
                    {data.months[monthIdx].weeks[weekIdx].dontForget.map((item, i) => (
                      <CheckRow key={i} item={item} accent={pal.accent} placeholder="—"
                        onToggle={() => { const a = [...data.months[monthIdx].weeks[weekIdx].dontForget]; a[i] = { ...a[i], checked: !a[i].checked }; update(["months", monthIdx, "weeks", weekIdx, "dontForget"], a); }}
                        onText={(t) => { const a = [...data.months[monthIdx].weeks[weekIdx].dontForget]; a[i] = { ...a[i], text: t }; update(["months", monthIdx, "weeks", weekIdx, "dontForget"], a); }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <Footer />
          </div>
        )}

        {/* ---------------- NOTES ---------------- */}
        {view === "notes" && (
          <div>
            <SectionHeader title="Notes" subtitle="For whatever doesn't fit anywhere else" accent="#6E88A0" header="#E4E7E6" onBack={goHome}
              crumbs={<>
                <Crumb label="Dot Grid" active={data.notes.style === "dot"} onClick={() => update(["notes", "style"], "dot")} />
                <Crumb label="Lined" active={data.notes.style === "lined"} onClick={() => update(["notes", "style"], "lined")} />
                <Crumb label="Graph" active={data.notes.style === "graph"} onClick={() => update(["notes", "style"], "graph")} />
                <Crumb label="Blank" active={data.notes.style === "blank"} onClick={() => update(["notes", "style"], "blank")} />
              </>} />
            <div className="p-6">
              <textarea
                value={data.notes.text}
                onChange={(e) => update(["notes", "text"], e.target.value)}
                rows={16}
                placeholder="Sketch, map it out, jot it down…"
                className="w-full outline-none text-[15px] p-4 rounded-xl resize-none"
                style={{
                  color: "#3A332C",
                  backgroundColor: "#FBF9F4",
                  backgroundImage:
                    data.notes.style === "dot" ? "radial-gradient(#C9C0B2 1px, transparent 1px)" :
                    data.notes.style === "lined" ? "repeating-linear-gradient(to bottom, transparent, transparent 30px, #DED6C8 31px)" :
                    data.notes.style === "graph" ? "linear-gradient(#E2DACC 1px, transparent 1px), linear-gradient(90deg, #E2DACC 1px, transparent 1px)" :
                    "none",
                  backgroundSize: data.notes.style === "dot" ? "18px 18px" : data.notes.style === "graph" ? "22px 22px" : "auto",
                }}
              />
            </div>
            <Footer />
          </div>
        )}

      </div>
    </div>
  );
}
