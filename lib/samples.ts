import type { ExtractionResult } from "./schemas";

import note1Data from "@/data/precomputed/note-1.json";
import note2Data from "@/data/precomputed/note-2.json";
import note3Data from "@/data/precomputed/note-3.json";
import note4Data from "@/data/precomputed/note-4.json";
import note5Data from "@/data/precomputed/note-5.json";

import {
  NOTE_1_TEXT,
  NOTE_2_TEXT,
  NOTE_3_TEXT,
  NOTE_4_TEXT,
  NOTE_5_TEXT,
} from "@/data/synthetic/note-texts";

export interface Sample {
  id: string;
  label: string;
  shape: string;
  text: string;
  precomputed: ExtractionResult;
}

export const SAMPLES: Sample[] = [
  {
    id: "note-1",
    label: "Brief ER triage",
    shape: "Terse, abbreviation-heavy",
    text: NOTE_1_TEXT,
    precomputed: note1Data as unknown as ExtractionResult,
  },
  {
    id: "note-2",
    label: "Detailed psych eval",
    shape: "Long, narrative",
    text: NOTE_2_TEXT,
    precomputed: note2Data as unknown as ExtractionResult,
  },
  {
    id: "note-3",
    label: "Phone consult dictation",
    shape: "Run-on with disfluencies",
    text: NOTE_3_TEXT,
    precomputed: note3Data as unknown as ExtractionResult,
  },
  {
    id: "note-4",
    label: "Cardiology consult letter",
    shape: "Formal, structured-ish but not SOAP",
    text: NOTE_4_TEXT,
    precomputed: note4Data as unknown as ExtractionResult,
  },
  {
    id: "note-5",
    label: "Messy new-patient intake",
    shape: "Semi-structured, mixed formats",
    text: NOTE_5_TEXT,
    precomputed: note5Data as unknown as ExtractionResult,
  },
];

export function getSample(id: string): Sample | undefined {
  return SAMPLES.find((s) => s.id === id);
}
