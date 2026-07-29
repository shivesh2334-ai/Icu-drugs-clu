import React, { useState, useMemo } from "react";
import { Search, Star, ChevronLeft, AlertTriangle, Droplet, Activity, ShieldAlert, Info, X } from "lucide-react";

/* ============================== DESIGN TOKENS ==============================
   Palette: clinical cool-gray/navy base, medical teal accent, semantic alert
   colors reserved strictly for the high-alert classification (not decoration).
   Display type: Space Grotesk. Numeric/data type: IBM Plex Mono — every dose,
   rate and concentration is set in mono so digits are unambiguous at a glance.
============================================================================ */

const FONT_IMPORT_URL =
  "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@500;600;700&family=Inter:wght@400;500;600&display=swap";

const ALERT = {
  green: { bg: "#EAF6EF", ring: "#1E8E5A", text: "#146B43", label: "Routine infusion" },
  orange: { bg: "#FBF0E2", ring: "#C9660A", text: "#9C4E08", label: "High-alert medication" },
  red: { bg: "#FBEAE7", ring: "#C4331F", text: "#961F11", label: "Requires central line" },
};

/* ============================== DRUG DATABASE ==============================
   Standard hospital ICU/CCU protocol concentrations. These are common
   default dilutions — always verify against local institutional protocol.
============================================================================ */

const DRUGS = [
  {
    id: "dobutamine",
    name: "Dobutamine",
    brand: "Dobutrex",
    class: "Inotrope",
    alert: "orange",
    line: "Central line preferred",
    indications: ["Cardiogenic shock", "Acute decompensated heart failure", "Low cardiac output syndrome"],
    ampoule: "250 mg in 20 mL",
    diluents: ["NS", "D5W"],
    finalVolume: 50,
    drugMg: 250,
    doseUnit: "mcg/kg/min",
    doseMin: 2,
    doseMax: 20,
    doseStep: [2, 5, 7.5, 10, 15, 20],
    maxDose: "20 mcg/kg/min",
    stability: "24 hr at room temperature",
    compatibility: ["NS", "D5W", "RL"],
    monitoring: ["Heart rate", "Blood pressure", "ECG", "Urine output", "Lactate"],
    contraindications: ["Hypertrophic obstructive cardiomyopathy", "Severe outflow tract obstruction"],
    warnings: ["May increase heart rate / provoke arrhythmia", "Tachyphylaxis with prolonged use"],
    sideEffects: ["Tachycardia", "Ectopy", "Hypotension (vasodilation)", "Headache"],
    references: "Riccardi et al. 2024 EJHF; institutional protocol",
  },
  {
    id: "noradrenaline",
    name: "Noradrenaline",
    brand: "Levophed, Norepinephrine",
    class: "Vasopressor",
    alert: "red",
    line: "Central line required",
    indications: ["Septic shock", "Cardiogenic shock", "Any distributive/vasodilatory shock"],
    ampoule: "4 mg in 4 mL",
    diluents: ["D5W (preferred)", "NS"],
    finalVolume: 50,
    drugMg: 4,
    doseUnit: "mcg/kg/min",
    doseMin: 0.01,
    doseMax: 1,
    doseStep: [0.01, 0.05, 0.1, 0.25, 0.5, 1],
    maxDose: "1–3 mcg/kg/min (institution dependent)",
    stability: "24 hr, protect from light",
    compatibility: ["NS", "D5W"],
    monitoring: ["Invasive arterial BP", "Heart rate", "Extremity perfusion", "Lactate"],
    contraindications: ["Uncorrected hypovolemia (correct volume first)"],
    warnings: ["Severe extravasation injury — dedicated central line", "Photosensitive"],
    sideEffects: ["Peripheral ischemia", "Arrhythmia", "Reflex bradycardia"],
    references: "Riccardi et al. 2024 EJHF; institutional protocol",
  },
  {
    id: "adrenaline",
    name: "Adrenaline",
    brand: "Epinephrine",
    class: "Vasopressor / Inotrope",
    alert: "red",
    line: "Central line required",
    indications: ["Cardiogenic shock (refractory)", "Anaphylaxis", "Cardiac arrest (ROSC infusion)"],
    ampoule: "1 mg in 1 mL",
    diluents: ["D5W", "NS"],
    finalVolume: 50,
    drugMg: 4,
    doseUnit: "mcg/kg/min",
    doseMin: 0.01,
    doseMax: 0.5,
    doseStep: [0.01, 0.05, 0.1, 0.2, 0.3, 0.5],
    maxDose: "0.5–1 mcg/kg/min",
    stability: "24 hr, protect from light",
    compatibility: ["NS", "D5W"],
    monitoring: ["Invasive arterial BP", "ECG", "Lactate", "Blood glucose"],
    contraindications: ["Caution in tachyarrhythmia"],
    warnings: ["Marked chronotropic/arrhythmogenic effect", "Extravasation risk"],
    sideEffects: ["Tachyarrhythmia", "Hyperglycemia", "Lactate elevation (metabolic)"],
    references: "Riccardi et al. 2024 EJHF; institutional protocol",
  },
  {
    id: "dopamine",
    name: "Dopamine",
    brand: "Intropin",
    class: "Vasopressor / Inotrope",
    alert: "orange",
    line: "Central line preferred",
    indications: ["Cardiogenic shock", "Symptomatic bradycardia (temporising)"],
    ampoule: "200 mg in 5 mL",
    diluents: ["NS", "D5W"],
    finalVolume: 50,
    drugMg: 400,
    doseUnit: "mcg/kg/min",
    doseMin: 2,
    doseMax: 20,
    doseStep: [2, 5, 7.5, 10, 15, 20],
    maxDose: "20 mcg/kg/min",
    stability: "24 hr, protect from light",
    compatibility: ["NS", "D5W"],
    monitoring: ["Heart rate", "Blood pressure", "ECG", "Urine output"],
    contraindications: ["Pheochromocytoma", "Uncorrected tachyarrhythmia"],
    warnings: ["Dose-dependent receptor effects — arrhythmogenic at higher doses"],
    sideEffects: ["Tachycardia", "Arrhythmia", "Nausea", "Peripheral vasoconstriction (high dose)"],
    references: "Riccardi et al. 2024 EJHF; institutional protocol",
  },
  {
    id: "vasopressin",
    name: "Vasopressin",
    brand: "Pitressin",
    class: "Vasopressor",
    alert: "red",
    line: "Central line required",
    indications: ["Septic shock (noradrenaline-sparing)", "Vasodilatory shock", "Cardiac arrest (select protocols)"],
    ampoule: "20 units in 1 mL",
    diluents: ["NS", "D5W"],
    finalVolume: 50,
    drugMg: null,
    drugUnits: 20,
    doseUnit: "units/min",
    doseMin: 0.01,
    doseMax: 0.04,
    doseStep: [0.01, 0.02, 0.03, 0.04],
    maxDose: "0.04 units/min (fixed-dose, non-titrated beyond this)",
    stability: "24 hr at room temperature",
    compatibility: ["NS", "D5W"],
    monitoring: ["Invasive arterial BP", "Extremity/digital perfusion", "Urine output", "Sodium"],
    contraindications: ["Caution in coronary artery disease (coronary vasoconstriction)"],
    warnings: ["Not typically titrated — fixed low dose add-on", "Extravasation risk"],
    sideEffects: ["Peripheral/mesenteric ischemia", "Hyponatremia", "Coronary vasoconstriction"],
    references: "Riccardi et al. 2024 EJHF; institutional protocol",
  },
  {
    id: "phenylephrine",
    name: "Phenylephrine",
    brand: "Neo-Synephrine",
    class: "Vasopressor",
    alert: "orange",
    line: "Central line preferred (peripheral short-term acceptable)",
    indications: ["Vasodilatory shock", "Hypotension with tachyarrhythmia (pure alpha effect wanted)"],
    ampoule: "10 mg in 1 mL",
    diluents: ["NS", "D5W"],
    finalVolume: 50,
    drugMg: 10,
    doseUnit: "mcg/kg/min",
    doseMin: 0.1,
    doseMax: 5,
    doseStep: [0.1, 0.5, 1, 2, 3, 5],
    maxDose: "5 mcg/kg/min",
    stability: "24 hr",
    compatibility: ["NS", "D5W"],
    monitoring: ["Invasive arterial BP", "Heart rate (reflex bradycardia)", "Extremity perfusion"],
    contraindications: ["Severe bradycardia", "Low cardiac output states (pure vasoconstrictor increases afterload)"],
    warnings: ["Reflex bradycardia", "Can reduce cardiac output"],
    sideEffects: ["Bradycardia", "Peripheral ischemia", "Hypertension (overshoot)"],
    references: "Riccardi et al. 2024 EJHF; institutional protocol",
  },
  {
    id: "milrinone",
    name: "Milrinone",
    brand: "Primacor",
    class: "Inodilator",
    alert: "orange",
    line: "Central line preferred",
    indications: ["Cardiogenic shock (beta-blocked patients)", "Acute decompensated heart failure with low output"],
    ampoule: "10 mg in 10 mL",
    diluents: ["NS", "D5W"],
    finalVolume: 50,
    drugMg: 20,
    doseUnit: "mcg/kg/min",
    doseMin: 0.125,
    doseMax: 0.75,
    doseStep: [0.125, 0.25, 0.375, 0.5, 0.75],
    maxDose: "0.75 mcg/kg/min (reduce in renal impairment)",
    stability: "24 hr",
    compatibility: ["NS", "D5W"],
    monitoring: ["Blood pressure", "Heart rhythm (ectopy)", "Renal function", "Urine output"],
    contraindications: ["Severe renal impairment without dose reduction", "Severe hypotension"],
    warnings: ["Long half-life — accumulates in renal impairment", "Vasodilation can worsen hypotension"],
    sideEffects: ["Hypotension", "Ventricular ectopy", "Thrombocytopenia (rare)"],
    references: "Riccardi et al. 2024 EJHF; institutional protocol",
  },
  {
    id: "amiodarone",
    name: "Amiodarone",
    brand: "Cordarone, Pacerone",
    class: "Antiarrhythmic (Class III)",
    alert: "orange",
    line: "Central line preferred for infusion >1 hr",
    indications: ["Ventricular tachycardia/fibrillation", "Atrial fibrillation rate/rhythm control", "Cardiac arrest (VF/pulseless VT)"],
    ampoule: "150 mg in 3 mL",
    diluents: ["D5W only (incompatible with NS for infusion)"],
    finalVolume: 250,
    drugMg: 450,
    doseUnit: "mg/hr",
    doseMin: 0.5,
    doseMax: 60,
    doseStep: [1, 33.3, 16.7, 8.3, 0.5],
    maxDose: "Load 150 mg over 10 min, then 1 mg/min ×6 hr, then 0.5 mg/min",
    stability: "24 hr, use glass or non-PVC container for concentrated infusion",
    compatibility: ["D5W"],
    monitoring: ["ECG / QT interval", "Blood pressure", "Liver function", "Thyroid function (long-term)"],
    contraindications: ["Severe sinus node dysfunction", "High-grade AV block without pacer"],
    warnings: ["Phlebitis with peripheral/prolonged infusion", "Incompatible with normal saline"],
    sideEffects: ["Hypotension (rate-related)", "Bradycardia", "QT prolongation", "Phlebitis"],
    references: "ACLS / institutional protocol",
  },
  {
    id: "lidocaine",
    name: "Lidocaine",
    brand: "Xylocaine",
    class: "Antiarrhythmic (Class IB)",
    alert: "orange",
    line: "Peripheral acceptable",
    indications: ["Ventricular arrhythmia (VT/VF, amiodarone alternative)"],
    ampoule: "2 g in 500 mL premix (4 mg/mL) — or 100 mg in 5 mL for prep",
    diluents: ["D5W", "NS"],
    finalVolume: 500,
    drugMg: 2000,
    doseUnit: "mg/min",
    doseMin: 1,
    doseMax: 4,
    doseStep: [1, 2, 3, 4],
    maxDose: "4 mg/min; reduce in hepatic impairment/heart failure",
    stability: "24 hr",
    compatibility: ["NS", "D5W"],
    monitoring: ["ECG", "Neurological status (toxicity)", "Blood pressure"],
    contraindications: ["Severe AV block", "Known local anaesthetic hypersensitivity"],
    warnings: ["CNS toxicity: tremor, confusion, seizures at high levels", "Reduce dose in liver dysfunction"],
    sideEffects: ["Drowsiness", "Perioral numbness", "Seizures (toxicity)", "Hypotension"],
    references: "ACLS / institutional protocol",
  },
  {
    id: "midazolam",
    name: "Midazolam",
    brand: "Versed",
    class: "Sedative (benzodiazepine)",
    alert: "orange",
    line: "Peripheral acceptable",
    indications: ["ICU sedation", "Status epilepticus (infusion)", "Procedural sedation"],
    ampoule: "50 mg in 10 mL",
    diluents: ["NS", "D5W"],
    finalVolume: 50,
    drugMg: 50,
    doseUnit: "mg/hr",
    doseMin: 1,
    doseMax: 10,
    doseStep: [1, 2, 4, 6, 8, 10],
    maxDose: "Titrate to sedation target (e.g. RASS); tolerance with prolonged use",
    stability: "24 hr",
    compatibility: ["NS", "D5W"],
    monitoring: ["Sedation score (RASS/SAS)", "Respiratory rate", "Blood pressure"],
    contraindications: ["Acute narrow-angle glaucoma"],
    warnings: ["Accumulates in hepatic/renal impairment and obesity", "Respiratory depression, especially with opioids"],
    sideEffects: ["Respiratory depression", "Hypotension", "Delirium (prolonged use)"],
    references: "Institutional sedation protocol",
  },
  {
    id: "dexmedetomidine",
    name: "Dexmedetomidine",
    brand: "Precedex",
    class: "Sedative (alpha-2 agonist)",
    alert: "orange",
    line: "Peripheral acceptable",
    indications: ["ICU sedation (light, cooperative)", "Facilitating ventilator weaning"],
    ampoule: "200 mcg in 2 mL",
    diluents: ["NS"],
    finalVolume: 50,
    drugMg: 0.4,
    doseUnit: "mcg/kg/hr",
    doseMin: 0.2,
    doseMax: 1.4,
    doseStep: [0.2, 0.4, 0.6, 0.8, 1, 1.4],
    maxDose: "1.4 mcg/kg/hr (no loading dose typically in ICU use)",
    stability: "24 hr",
    compatibility: ["NS"],
    monitoring: ["Heart rate", "Blood pressure", "Sedation score"],
    contraindications: ["Advanced heart block without pacer"],
    warnings: ["Bradycardia and hypotension, especially with loading dose"],
    sideEffects: ["Bradycardia", "Hypotension", "Dry mouth"],
    references: "Institutional sedation protocol",
  },
  {
    id: "propofol",
    name: "Propofol",
    brand: "Diprivan",
    class: "Sedative (anaesthetic agent)",
    alert: "orange",
    line: "Central or large peripheral line",
    indications: ["ICU sedation (ventilated patients)", "Induction/maintenance of anaesthesia"],
    ampoule: "500 mg in 50 mL (10 mg/mL premix)",
    diluents: ["Ready-mixed emulsion — do not dilute further"],
    finalVolume: 50,
    drugMg: 500,
    doseUnit: "mcg/kg/min",
    doseMin: 5,
    doseMax: 50,
    doseStep: [5, 10, 20, 30, 40, 50],
    maxDose: "50 mcg/kg/min (higher short-term under anaesthesia supervision)",
    stability: "12 hr once opened (lipid emulsion — strict asepsis)",
    compatibility: ["Do not co-infuse in same line without flush"],
    monitoring: ["Blood pressure", "Sedation score", "Triglycerides (prolonged use)", "Signs of PRIS"],
    contraindications: ["Egg/soy allergy (formulation-dependent)", "Hemodynamic instability (caution)"],
    warnings: ["Propofol infusion syndrome (PRIS) with high-dose/prolonged use", "Significant hypotension"],
    sideEffects: ["Hypotension", "Injection pain", "Hypertriglyceridemia", "PRIS (rare, high dose)"],
    references: "Institutional sedation protocol",
  },
  {
    id: "ketamine",
    name: "Ketamine",
    brand: "Ketalar",
    class: "Sedative / Analgesic (NMDA antagonist)",
    alert: "orange",
    line: "Peripheral acceptable",
    indications: ["Adjunct ICU sedation/analgesia", "Refractory status asthmaticus", "Procedural sedation"],
    ampoule: "500 mg in 10 mL",
    diluents: ["NS", "D5W"],
    finalVolume: 50,
    drugMg: 500,
    doseUnit: "mcg/kg/min",
    doseMin: 1,
    doseMax: 5,
    doseStep: [1, 2, 3, 4, 5],
    maxDose: "5 mcg/kg/min for sedation adjunct (higher for anaesthesia)",
    stability: "24 hr",
    compatibility: ["NS", "D5W"],
    monitoring: ["Blood pressure", "Heart rate", "Sedation score", "Emergence phenomena"],
    contraindications: ["Uncontrolled hypertension", "Severe cardiac disease (relative)"],
    warnings: ["Emergence reactions (hallucinations)", "Sympathomimetic — can raise BP/HR"],
    sideEffects: ["Hypertension", "Tachycardia", "Hypersalivation", "Emergence phenomena"],
    references: "Institutional sedation protocol",
  },
  {
    id: "fentanyl",
    name: "Fentanyl",
    brand: "Sublimaze",
    class: "Opioid analgesic",
    alert: "orange",
    line: "Peripheral acceptable",
    indications: ["ICU analgesia", "Analgosedation for ventilated patients"],
    ampoule: "500 mcg in 10 mL",
    diluents: ["NS", "D5W"],
    finalVolume: 50,
    drugMg: 0.5,
    doseUnit: "mcg/kg/hr",
    doseMin: 0.5,
    doseMax: 3,
    doseStep: [0.5, 1, 1.5, 2, 3],
    maxDose: "3 mcg/kg/hr (titrate to analgesia target)",
    stability: "24 hr",
    compatibility: ["NS", "D5W"],
    monitoring: ["Respiratory rate", "Pain/sedation score", "Blood pressure"],
    contraindications: ["Known hypersensitivity"],
    warnings: ["Respiratory depression", "Accumulates with prolonged infusion (context-sensitive half-life)"],
    sideEffects: ["Respiratory depression", "Hypotension", "Ileus", "Tolerance/withdrawal"],
    references: "Institutional sedation/analgesia protocol",
  },
  {
    id: "heparin",
    name: "Unfractionated Heparin",
    brand: "Heparin sodium",
    class: "Anticoagulant",
    alert: "red",
    line: "Peripheral acceptable",
    indications: ["ACS (UFH strategy)", "VTE treatment", "Bridging anticoagulation", "Mechanical circulatory support"],
    ampoule: "25,000 units in 5 mL",
    diluents: ["NS", "D5W"],
    finalVolume: 250,
    drugMg: null,
    drugUnits: 25000,
    doseUnit: "units/hr",
    doseMin: 400,
    doseMax: 2000,
    doseStep: [400, 800, 1000, 1200, 1500, 2000],
    maxDose: "Per weight-based nomogram; titrate to aPTT",
    stability: "24 hr",
    compatibility: ["NS", "D5W"],
    monitoring: ["aPTT (4–6 hourly until stable)", "Platelet count (HIT surveillance)", "Signs of bleeding"],
    contraindications: ["Active major bleeding", "Heparin-induced thrombocytopenia (HIT)"],
    warnings: ["Bleeding risk", "HIT — monitor platelets"],
    sideEffects: ["Bleeding", "HIT", "Hyperkalemia (rare)"],
    references: "Institutional weight-based heparin nomogram",
  },
  {
    id: "alteplase",
    name: "Alteplase",
    brand: "Actilyse, tPA",
    class: "Thrombolytic",
    alert: "red",
    line: "Dedicated line",
    indications: ["STEMI (if PCI unavailable)", "Acute ischemic stroke", "Massive/high-risk PE"],
    ampoule: "50 mg vial (reconstitute to 1 mg/mL)",
    diluents: ["Sterile water for injection (as supplied)"],
    finalVolume: 100,
    drugMg: 100,
    doseUnit: "mg/hr",
    doseMin: 5,
    doseMax: 90,
    doseStep: [10, 20, 30, 45, 60],
    maxDose: "Max 90 mg total (STEMI, weight-based); PE/stroke protocols differ",
    stability: "8 hr reconstituted, refrigerate if not used immediately",
    compatibility: ["Do not mix with other drugs in same line"],
    monitoring: ["Bleeding signs", "Neuro checks (stroke protocol)", "Blood pressure", "Fibrinogen"],
    contraindications: ["Active internal bleeding", "Recent stroke/surgery", "Severe uncontrolled hypertension"],
    warnings: ["Major bleeding/intracranial hemorrhage risk", "Strict protocol-specific dosing by indication"],
    sideEffects: ["Bleeding", "Intracranial hemorrhage", "Reperfusion arrhythmia", "Hypotension"],
    references: "STEMI / stroke / PE thrombolysis protocol",
  },
  {
    id: "nitroglycerin",
    name: "Nitroglycerin",
    brand: "GTN, Nitrostat IV",
    class: "Vasodilator",
    alert: "orange",
    line: "Peripheral acceptable (non-PVC tubing preferred)",
    indications: ["Acute coronary syndrome", "Acute pulmonary edema / hypertensive heart failure", "Controlled hypotension"],
    ampoule: "50 mg in 10 mL",
    diluents: ["NS", "D5W"],
    finalVolume: 250,
    drugMg: 50,
    doseUnit: "mcg/min",
    doseMin: 5,
    doseMax: 200,
    doseStep: [5, 10, 20, 50, 100, 200],
    maxDose: "200 mcg/min (institution dependent)",
    stability: "24 hr, absorbs into standard PVC tubing — use non-PVC set",
    compatibility: ["NS", "D5W"],
    monitoring: ["Blood pressure (continuous/frequent)", "Heart rate", "Headache"],
    contraindications: ["Right ventricular infarction", "Recent PDE5-inhibitor use (severe hypotension)", "Severe hypotension"],
    warnings: ["Tachyphylaxis with prolonged use", "Absorbs into PVC tubing — reduces delivered dose"],
    sideEffects: ["Headache", "Hypotension", "Reflex tachycardia"],
    references: "ACS / heart failure protocol",
  },
  {
    id: "nicardipine",
    name: "Nicardipine",
    brand: "Cardene",
    class: "Antihypertensive (calcium channel blocker)",
    alert: "orange",
    line: "Central line preferred (peripheral short-term acceptable)",
    indications: ["Hypertensive emergency", "Post-operative blood pressure control"],
    ampoule: "25 mg in 10 mL",
    diluents: ["NS", "D5W"],
    finalVolume: 100,
    drugMg: 25,
    doseUnit: "mg/hr",
    doseMin: 5,
    doseMax: 15,
    doseStep: [5, 7.5, 10, 12.5, 15],
    maxDose: "15 mg/hr",
    stability: "24 hr, protect from light",
    compatibility: ["NS", "D5W"],
    monitoring: ["Blood pressure (continuous)", "Heart rate"],
    contraindications: ["Advanced aortic stenosis", "Acute heart failure with low output"],
    warnings: ["Reflex tachycardia", "Phlebitis with peripheral/prolonged use"],
    sideEffects: ["Hypotension", "Tachycardia", "Headache", "Flushing"],
    references: "Hypertensive emergency protocol",
  },
  {
    id: "potassium-chloride",
    name: "Potassium Chloride",
    brand: "KCl",
    class: "Electrolyte replacement",
    alert: "red",
    line: "Central line for concentrated/rapid replacement",
    indications: ["Hypokalemia correction"],
    ampoule: "20 mEq in 10 mL concentrate",
    diluents: ["NS", "D5W (never undiluted bolus)"],
    finalVolume: 100,
    drugMg: null,
    drugUnits: 20,
    doseUnit: "mEq/hr",
    doseMin: 5,
    doseMax: 20,
    doseStep: [5, 10, 15, 20],
    maxDose: "Peripheral: ≤10 mEq/hr; Central: up to 20 mEq/hr with continuous ECG",
    stability: "24 hr",
    compatibility: ["NS", "D5W"],
    monitoring: ["Serum potassium (recheck 2–4 hrly)", "ECG if rate >10 mEq/hr", "Renal function"],
    contraindications: ["Hyperkalemia", "Severe renal failure without dialysis plan"],
    warnings: ["NEVER give IV push/undiluted", "Cardiac arrhythmia risk if infused too rapidly"],
    sideEffects: ["Phlebitis", "Hyperkalemia (over-replacement)", "Arrhythmia (rapid infusion)"],
    references: "Institutional electrolyte replacement protocol",
  },
  {
    id: "insulin",
    name: "Regular Insulin",
    brand: "Human Actrapid, Humulin R",
    class: "Insulin infusion",
    alert: "red",
    line: "Peripheral acceptable (dedicated line preferred)",
    indications: ["Diabetic ketoacidosis", "Hyperosmolar hyperglycemic state", "ICU glycemic control"],
    ampoule: "100 units in 1 mL",
    diluents: ["NS (prime line — insulin adsorbs to tubing)"],
    finalVolume: 100,
    drugMg: null,
    drugUnits: 100,
    doseUnit: "units/hr",
    doseMin: 0.5,
    doseMax: 10,
    doseStep: [0.5, 1, 2, 4, 6, 10],
    maxDose: "Per institutional sliding-scale/DKA protocol",
    stability: "24 hr",
    compatibility: ["NS"],
    monitoring: ["Blood glucose (hourly initially)", "Serum potassium", "Anion gap (DKA)"],
    contraindications: ["Hypoglycemia (hold infusion)"],
    warnings: ["Prime tubing before use — significant adsorption loss", "Hypokalemia risk as glucose corrects"],
    sideEffects: ["Hypoglycemia", "Hypokalemia"],
    references: "DKA / glycemic control protocol",
  },
];

const CATEGORIES = [...new Set(DRUGS.map((d) => d.class))];

/* ============================== CALC ENGINE ============================== */

function concentration(drug) {
  // returns { value, unit } concentration per mL of final infusion
  if (drug.drugUnits) return { value: drug.drugUnits / drug.finalVolume, unit: "units/mL" };
  return { value: (drug.drugMg * 1000) / drug.finalVolume, unit: "mcg/mL" }; // mcg/mL
}

function computeRate(drug, weightKg, dose) {
  const conc = concentration(drug);
  let mlPerHr, mcgPerMin, mgPerHr, unitsPerHr;

  if (drug.doseUnit === "mcg/kg/min") {
    mcgPerMin = weightKg * dose;
    mlPerHr = (mcgPerMin * 60) / conc.value;
    mgPerHr = (mcgPerMin * 60) / 1000;
  } else if (drug.doseUnit === "mcg/kg/hr") {
    mlPerHr = (weightKg * dose) / conc.value;
    mcgPerMin = (weightKg * dose) / 60;
    mgPerHr = (weightKg * dose) / 1000;
  } else if (drug.doseUnit === "mg/hr") {
    mlPerHr = (dose * 1000) / conc.value;
    mgPerHr = dose;
    mcgPerMin = (dose * 1000) / 60;
  } else if (drug.doseUnit === "mg/min") {
    mlPerHr = ((dose * 1000) / conc.value) * 60;
    mgPerHr = dose * 60;
    mcgPerMin = dose * 1000;
  } else if (drug.doseUnit === "mcg/min") {
    mlPerHr = (dose * 60) / conc.value;
    mcgPerMin = dose;
    mgPerHr = (dose * 60) / 1000;
  } else if (drug.doseUnit === "units/min") {
    mlPerHr = (dose * 60) / conc.value;
    unitsPerHr = dose * 60;
  } else if (drug.doseUnit === "units/hr") {
    mlPerHr = dose / conc.value;
    unitsPerHr = dose;
  } else if (drug.doseUnit === "mEq/hr") {
    mlPerHr = dose / conc.value;
  }

  const totalDrug24h = drug.drugUnits
    ? (unitsPerHr ?? dose) * 24
    : (mgPerHr ?? 0) * 24;
  const ampoulesNeeded = drug.drugUnits
    ? totalDrug24h / drug.drugUnits
    : totalDrug24h / drug.drugMg;

  return { mlPerHr, mcgPerMin, mgPerHr, unitsPerHr, conc, totalDrug24h, ampoulesNeeded };
}

function fmt(n, dp = 2) {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  if (n === 0) return "0";
  const abs = Math.abs(n);
  const decimals = abs >= 100 ? 1 : abs >= 10 ? 1 : abs >= 1 ? 2 : 3;
  return n.toFixed(dp === undefined ? decimals : dp).replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
}

/* ============================== UI ATOMS ============================== */

function AlertBadge({ level }) {
  const a = ALERT[level];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: a.bg, color: a.text, border: `1px solid ${a.ring}55` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: a.ring }} />
      {a.label}
    </span>
  );
}

function Section({ icon: Icon, title, children, tone = "#0B2740" }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={15} strokeWidth={2.5} color={tone} />
        <h3
          className="text-[11px] font-semibold tracking-[0.14em] uppercase"
          style={{ color: tone, fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

/* ============================== DRUG DETAIL ============================== */

function DrugDetail({ drug, onBack, isFav, toggleFav }) {
  const [weight, setWeight] = useState(70);
  const [dose, setDose] = useState(
    Math.round(((drug.doseMin + drug.doseMax) / 2) * 100) / 100
  );

  const result = useMemo(() => computeRate(drug, weight, dose), [drug, weight, dose]);
  const a = ALERT[drug.alert];

  return (
    <div className="pb-10">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm font-medium mb-4 text-[#0B2740]/70 hover:text-[#0B2740]"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <ChevronLeft size={16} /> All drugs
      </button>

      <div
        className="rounded-2xl overflow-hidden mb-5"
        style={{ borderLeft: `5px solid ${a.ring}`, background: "#fff", boxShadow: "0 1px 3px rgba(11,39,64,0.08)" }}
      >
        <div className="p-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1
                className="text-2xl font-semibold text-[#0B2740] leading-tight"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {drug.name}
              </h1>
              <p className="text-sm text-[#0B2740]/55 mt-0.5">{drug.brand} · {drug.class}</p>
            </div>
            <button onClick={() => toggleFav(drug.id)} aria-label="Toggle favorite">
              <Star
                size={22}
                color={isFav ? "#C9660A" : "#0B274033"}
                fill={isFav ? "#C9660A" : "none"}
              />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <AlertBadge level={drug.alert} />
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#0B27400D] text-[#0B2740]/70">
              {drug.line}
            </span>
          </div>
        </div>
      </div>

      {/* CALCULATOR — signature element */}
      <div
        className="rounded-2xl p-5 mb-5"
        style={{ background: "#0B2740", boxShadow: "0 4px 20px rgba(11,39,64,0.25)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Activity size={15} color="#7FD4C9" strokeWidth={2.5} />
          <h3 className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#7FD4C9]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Live Calculator
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <label className="block">
            <span className="text-xs text-white/50 font-medium">Patient weight (kg)</span>
            <input
              type="number"
              value={weight}
              min={1}
              max={300}
              onChange={(e) => setWeight(Number(e.target.value) || 0)}
              className="w-full mt-1 bg-white/10 border border-white/15 rounded-lg px-3 py-2 text-white text-lg font-semibold outline-none focus:border-[#7FD4C9]"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            />
          </label>
          <label className="block">
            <span className="text-xs text-white/50 font-medium">Desired dose ({drug.doseUnit})</span>
            <input
              type="number"
              value={dose}
              step="any"
              onChange={(e) => setDose(Number(e.target.value) || 0)}
              className="w-full mt-1 bg-white/10 border border-white/15 rounded-lg px-3 py-2 text-white text-lg font-semibold outline-none focus:border-[#7FD4C9]"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            />
          </label>
        </div>

        <input
          type="range"
          min={drug.doseMin}
          max={drug.doseMax}
          step={(drug.doseMax - drug.doseMin) / 100}
          value={dose}
          onChange={(e) => setDose(Number(e.target.value))}
          className="w-full mb-4 accent-[#7FD4C9]"
        />

        <div className="rounded-xl bg-white/5 border border-white/10 p-4 flex items-baseline justify-between">
          <span className="text-xs text-white/50 font-medium uppercase tracking-wide">Infusion rate</span>
          <div className="text-right">
            <span
              className="text-4xl font-bold text-white tabular-nums"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {fmt(result.mlPerHr)}
            </span>
            <span className="text-sm text-white/60 ml-1.5 font-medium">mL/hr</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-3">
          <MiniStat label="mcg/min" value={result.mcgPerMin} />
          <MiniStat label="mg/hr" value={result.mgPerHr} />
          <MiniStat
            label={drug.drugUnits ? "Vials/24h" : "Ampoules/24h"}
            value={result.ampoulesNeeded}
          />
        </div>
        <p className="text-[11px] text-white/35 mt-3 leading-snug">
          Concentration: {drug.ampoule} → made up to {drug.finalVolume} mL = {fmt(result.conc.value, 1)} {result.conc.unit}
        </p>
      </div>

      {/* AUTO TABLE */}
      <Section icon={Droplet} title="Dose Reference Table">
        <div className="rounded-xl overflow-hidden border border-[#0B274014]">
          <table className="w-full text-sm" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            <thead>
              <tr className="bg-[#0B27400A] text-[#0B2740]/60 text-xs uppercase tracking-wide">
                <th className="text-left px-3 py-2 font-semibold">Dose ({drug.doseUnit})</th>
                <th className="text-right px-3 py-2 font-semibold">Rate (mL/hr)</th>
              </tr>
            </thead>
            <tbody>
              {drug.doseStep.map((d, i) => {
                const r = computeRate(drug, weight, d);
                const active = Math.abs(d - dose) < 1e-6;
                return (
                  <tr
                    key={i}
                    onClick={() => setDose(d)}
                    className={`cursor-pointer border-t border-[#0B274010] ${active ? "bg-[#0E7C860F]" : ""}`}
                  >
                    <td className={`px-3 py-2 ${active ? "text-[#0E7C86] font-semibold" : "text-[#0B2740]/80"}`}>{fmt(d)}</td>
                    <td className={`px-3 py-2 text-right ${active ? "text-[#0E7C86] font-semibold" : "text-[#0B2740]/80"}`}>{fmt(r.mlPerHr)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-[#0B2740]/40 mt-1.5">at weight = {weight} kg — tap a row to load it into the calculator</p>
      </Section>

      <Section icon={Info} title="Preparation">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <InfoCell label="Ampoule" value={drug.ampoule} />
          <InfoCell label="Diluent" value={drug.diluents.join(", ")} />
          <InfoCell label="Final volume" value={`${drug.finalVolume} mL`} />
          <InfoCell label="Stability" value={drug.stability} />
          <InfoCell label="Dose range" value={`${drug.doseMin}–${drug.doseMax} ${drug.doseUnit}`} />
          <InfoCell label="Compatible with" value={drug.compatibility.join(", ")} />
        </div>
      </Section>

      <Section icon={Activity} title="Indications">
        <ul className="text-sm text-[#0B2740]/75 space-y-1 list-disc list-inside">
          {drug.indications.map((x, i) => <li key={i}>{x}</li>)}
        </ul>
      </Section>

      <Section icon={ShieldAlert} title="Monitoring">
        <div className="flex flex-wrap gap-1.5">
          {drug.monitoring.map((m, i) => (
            <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-[#0E7C860F] text-[#0E7C86] font-medium">{m}</span>
          ))}
        </div>
      </Section>

      <Section icon={AlertTriangle} title="Contraindications & Warnings" tone={ALERT[drug.alert].ring}>
        <div className="rounded-xl p-3.5" style={{ background: ALERT[drug.alert].bg }}>
          <p className="text-xs font-semibold mb-1" style={{ color: ALERT[drug.alert].text }}>Contraindications</p>
          <ul className="text-sm space-y-0.5 mb-2.5" style={{ color: ALERT[drug.alert].text }}>
            {drug.contraindications.map((x, i) => <li key={i}>· {x}</li>)}
          </ul>
          <p className="text-xs font-semibold mb-1" style={{ color: ALERT[drug.alert].text }}>Warnings</p>
          <ul className="text-sm space-y-0.5" style={{ color: ALERT[drug.alert].text }}>
            {drug.warnings.map((x, i) => <li key={i}>· {x}</li>)}
          </ul>
        </div>
      </Section>

      <Section icon={Info} title="Adverse Effects">
        <p className="text-sm text-[#0B2740]/75">{drug.sideEffects.join(" · ")}</p>
      </Section>

      <p className="text-[11px] text-[#0B2740]/35 pt-2 border-t border-[#0B274012]">
        Reference: {drug.references}
      </p>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-2 text-center">
      <div className="text-sm font-semibold text-white tabular-nums" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
        {fmt(value)}
      </div>
      <div className="text-[10px] text-white/40 mt-0.5">{label}</div>
    </div>
  );
}

function InfoCell({ label, value }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-[#0B2740]/40 font-semibold mb-0.5">{label}</div>
      <div className="text-[#0B2740]/85 text-sm leading-snug">{value}</div>
    </div>
  );
}

/* ============================== DRUG CARD ============================== */

function DrugCard({ drug, onOpen, isFav, toggleFav }) {
  const a = ALERT[drug.alert];
  return (
    <button
      onClick={() => onOpen(drug)}
      className="w-full text-left rounded-xl p-3.5 bg-white flex items-center gap-3 active:scale-[0.99] transition-transform"
      style={{ borderLeft: `4px solid ${a.ring}`, boxShadow: "0 1px 2px rgba(11,39,64,0.06)" }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#0B2740] truncate" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{drug.name}</span>
        </div>
        <p className="text-xs text-[#0B2740]/45 truncate mt-0.5">{drug.class} · {drug.doseMin}–{drug.doseMax} {drug.doseUnit}</p>
      </div>
      <span
        onClick={(e) => { e.stopPropagation(); toggleFav(drug.id); }}
        className="p-1"
      >
        <Star size={17} color={isFav ? "#C9660A" : "#0B274030"} fill={isFav ? "#C9660A" : "none"} />
      </span>
    </button>
  );
}

/* ============================== HOME ============================== */

export default function InfusionCalculator() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [showFavOnly, setShowFavOnly] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  const toggleFav = (id) =>
    setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));

  const filtered = useMemo(() => {
    return DRUGS.filter((d) => {
      if (showFavOnly && !favorites.includes(d.id)) return false;
      if (category !== "All" && d.class !== category) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        d.name.toLowerCase().includes(q) ||
        d.brand.toLowerCase().includes(q) ||
        d.class.toLowerCase().includes(q) ||
        d.indications.some((i) => i.toLowerCase().includes(q))
      );
    });
  }, [query, category, showFavOnly, favorites]);

  return (
    <div
      className="min-h-screen w-full"
      style={{ background: "#F4F7F8", fontFamily: "'Inter', sans-serif" }}
    >
      <style>{`@import url('${FONT_IMPORT_URL}');`}</style>

      {/* HEADER */}
      <div className="sticky top-0 z-20" style={{ background: "#0B2740" }}>
        <div className="px-4 pt-5 pb-4">
          <p className="text-[10px] tracking-[0.2em] uppercase text-[#7FD4C9] font-semibold mb-1">EMC Critical Care</p>
          <h1 className="text-xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Infusion Calculator
          </h1>
        </div>
        {!selected && (
          <div className="px-4 pb-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search drug, class, or indication…"
                className="w-full bg-white/10 border border-white/15 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-white/40 outline-none focus:border-[#7FD4C9]"
              />
            </div>
          </div>
        )}
      </div>

      <div className="px-4 pt-4 max-w-2xl mx-auto">
        {showDisclaimer && !selected && (
          <div className="rounded-xl p-3.5 mb-4 flex gap-2.5" style={{ background: "#FBF0E2", border: "1px solid #C9660A33" }}>
            <AlertTriangle size={17} color="#9C4E08" className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-[#9C4E08] leading-relaxed">
                <strong>Clinical decision support only</strong> — for use by qualified healthcare professionals. Verify every calculated dose against institutional protocol, prescribing information, and patient-specific factors before administration.
              </p>
            </div>
            <button onClick={() => setShowDisclaimer(false)} className="shrink-0"><X size={15} color="#9C4E08" /></button>
          </div>
        )}

        {!selected ? (
          <>
            <div className="flex gap-1.5 overflow-x-auto pb-1 mb-3 -mx-4 px-4 no-scrollbar">
              {["All", ...CATEGORIES].map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors"
                  style={
                    category === c
                      ? { background: "#0B2740", color: "#fff" }
                      : { background: "#fff", color: "#0B274088", border: "1px solid #0B274014" }
                  }
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#0B2740]/50 uppercase tracking-wide">
                {filtered.length} drug{filtered.length !== 1 ? "s" : ""}
              </span>
              <button
                onClick={() => setShowFavOnly((v) => !v)}
                className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full"
                style={showFavOnly ? { background: "#C9660A18", color: "#9C4E08" } : { color: "#0B274070" }}
              >
                <Star size={13} fill={showFavOnly ? "#C9660A" : "none"} color={showFavOnly ? "#C9660A" : "#0B274070"} />
                Favorites
              </button>
            </div>

            <div className="space-y-2 pb-8">
              {filtered.length === 0 ? (
                <p className="text-sm text-[#0B2740]/40 text-center py-10">No drugs match your search.</p>
              ) : (
                filtered.map((d) => (
                  <DrugCard key={d.id} drug={d} onOpen={setSelected} isFav={favorites.includes(d.id)} toggleFav={toggleFav} />
                ))
              )}
            </div>
          </>
        ) : (
          <DrugDetail
            drug={selected}
            onBack={() => setSelected(null)}
            isFav={favorites.includes(selected.id)}
            toggleFav={toggleFav}
          />
        )}
      </div>
    </div>
  );
}
