/* ---------- palette (cycles every 5 months, matching the original planner) ---------- */
export const PALETTE = [
  { accent: "#C1694B", header: "#F1E1D6", soft: "#F6E9E2", border: "#DCB49E" }, // terracotta
  { accent: "#6E88A0", header: "#E4E7E6", soft: "#EDEFEE", border: "#B9C6CE" }, // blue-grey
  { accent: "#7C8A57", header: "#EBE8DC", soft: "#F1EFE5", border: "#C4CBA9" }, // olive
  { accent: "#8C7A63", header: "#EDE4D9", soft: "#F3ECE3", border: "#D2BFA9" }, // taupe
  { accent: "#5B4A5C", header: "#E9E2E7", soft: "#F1ECEF", border: "#C4B2C6" }, // plum
];

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const deepClone =
  typeof structuredClone === "function" ? structuredClone : (o) => JSON.parse(JSON.stringify(o));

export function makeChecks(n) {
  return Array.from({ length: n }, () => ({ text: "", checked: false }));
}

export function makeDefaultData() {
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
