// Auto-importable text constants for the 5 synthetic notes.
// The .txt files in this directory remain the canonical source for the
// precompute script + eval runner (they read via fs).

export const NOTE_1_TEXT = `# SYNTHETIC DATA — NOT REAL PATIENT INFORMATION

ED Triage Note
Pt: Jane D., DOB 04/12/19XX, MRN 000-12-3456
CC: SOB x 2 hrs, wheezing
HPI: 32yo F w/ hx asthma, ran out of albuterol 3d ago. Acute SOB after running for bus. Denies chest pain, fever, recent illness. No URI sx.
Vitals: BP 128/82, HR 102, RR 24, SpO2 92% RA, T 98.4F
Exam: A&Ox3, mild distress, accessory muscle use, diffuse exp wheezes b/l, no rales.
A: Acute asthma exacerbation, moderate.
P: Albuterol neb x1, methylpred 60mg IV, recheck SpO2 in 30. D/c w/ albuterol refill + 5d pred taper if responds. RTC if worse.
`;

export const NOTE_2_TEXT = `# SYNTHETIC DATA — NOT REAL PATIENT INFORMATION

Initial Psychiatric Evaluation
Patient: Marcus T.
DOB: 08/03/19XX
MRN: 778-44-1029
Date of Service: [redacted]

Chief Complaint:
"I can't focus and I haven't slept right in three months."

History of Present Illness:
Mr. T. is a 41-year-old male, software engineer, presenting for evaluation of mood and concentration concerns. He reports onset of symptoms approximately 12 weeks ago, coinciding with a workplace reorganization. He describes initial difficulty falling asleep, progressing to early morning awakening (3:30–4:00 AM) with inability to return to sleep. He notes pervasive fatigue, anhedonia ("I used to look forward to climbing on weekends — I haven't gone in months"), and difficulty concentrating at work. He denies frank suicidal ideation but admits to "passive thoughts" of "not waking up." He denies plan or intent. No prior psychiatric history. No prior trials of antidepressants. No history of mania, psychosis, or substance dependence. Drinks 4–6 units of alcohol per week, primarily weekends. Denies illicit drug use. Family hx significant for maternal MDD, treated with sertraline.

Past Medical History:
Hypothyroidism, well-controlled on levothyroxine 75 mcg daily. No other chronic conditions. NKDA.

Mental Status Exam:
Patient is well-groomed, cooperative, with appropriate eye contact. Speech is normal in rate and tone. Mood reported as "flat." Affect is congruent, mildly constricted. Thought process linear and goal-directed. No perceptual disturbances. Insight and judgment intact.

Assessment:
Major Depressive Disorder, single episode, moderate. Differential includes adjustment disorder with depressed mood given the temporal relationship to workplace stressor; however, severity and duration favor MDD. Hypothyroidism is a contributing factor to consider, though TSH was 1.8 last month per outside records.

Plan:
1. Initiate sertraline 50 mg PO daily; titrate per response in 2 weeks.
2. Sleep hygiene counseling provided.
3. Refer to CBT therapist; patient expressed openness.
4. Repeat TSH in 4 weeks.
5. Safety plan reviewed. Crisis line provided. Patient agreed to contact if SI worsens.
6. Follow up in 2 weeks.
`;

export const NOTE_3_TEXT = `# SYNTHETIC DATA — NOT REAL PATIENT INFORMATION

Phone Consult — Lightly Cleaned Dictation
Pt: Robert K., DOB 11/22/19XX
Phone: (555) 014-2233

So um yeah Mr. K called this afternoon, he's been having this rash on his um forearms, both sides, for about — I think he said about ten days now. He says it started after he was doing yard work, pulling some weeds out of the side of the house. It's red, kind of bumpy, very itchy especially at night, he said it's keeping him up. Um, no fever, no, he doesn't think it's spreading anywhere else. No new soaps or detergents he can think of. He did say he's tried some hydrocortisone cream OTC and it helped a little but not a lot.

Allergies — uh he says NKDA but he's never really had a skin allergy before that he knows of.

I told him this sounds like contact dermatitis, possibly poison ivy or oak given the timing and the yard work. I told him to wash everything that was outside with him — the gloves, the clothes, all of it — and to use a cool compress. I called in triamcinolone 0.1% cream for him to the pharmacy, apply twice daily for up to two weeks. If it spreads to his face or he gets shortness of breath or any swelling he needs to go to the ER. Otherwise call back in a week if not improving.
`;

export const NOTE_4_TEXT = `# SYNTHETIC DATA — NOT REAL PATIENT INFORMATION

Cardiology Consult Letter

To: Dr. Aisha P., Internal Medicine
From: Dr. Henry W., Cardiology
Re: Sofia L., DOB 02/14/19XX, MRN 442-009-118

Dear Dr. P.,

Thank you for referring Ms. L. for evaluation of palpitations and exertional dyspnea. I had the pleasure of seeing her in clinic today.

Ms. L. is a 58-year-old woman with a past medical history significant for hypertension (on lisinopril 20 mg daily), dyslipidemia (on atorvastatin 40 mg daily), and a 25 pack-year smoking history (quit 4 years ago). She reports a 6-month history of intermittent palpitations, occurring 3–5 times per week, lasting seconds to a few minutes. They are not associated with chest pain, but she does describe shortness of breath when climbing two flights of stairs, which is new for her.

On examination, BP was 132/78, HR 72 and regular. Cardiac auscultation revealed a soft systolic murmur at the apex, grade 2/6, without radiation. Lungs were clear. No peripheral edema. ECG today showed normal sinus rhythm with occasional PACs and no ischemic changes.

I have ordered the following:
- 48-hour Holter monitor
- Echocardiogram
- BMP, lipid panel, TSH, and HgbA1c

In the meantime, I have not initiated any new medications. If the Holter reveals significant arrhythmia or the echo demonstrates structural disease, we will discuss further. I have asked her to keep a symptom diary.

I will follow up with her in 4 weeks once results are in. Please do not hesitate to reach out if you have questions.

Warm regards,
Henry W., MD
Cardiology
`;

export const NOTE_5_TEXT = `# SYNTHETIC DATA — NOT REAL PATIENT INFORMATION

NEW PATIENT INTAKE FORM (transcribed)
Name: Priya S.
DOB: 06/30/19XX
MRN: pending
Address: 412 Elm St, Apt 3B
Phone: 555.802.9911
Email: priya.s.sample@example.com

Reason for visit: knee pain
Which knee? right
How long? "since like January maybe? got worse last month"
Pain scale (0-10): 6 most days, 8 after standing
Mechanism / injury? "no specific injury — i hike a lot"
Swelling? sometimes
Locking / giving way? "feels unstable on stairs"
Prior treatment? "ibuprofen, ice. helps a little"

Past medical: nothing
Surgeries: none
Meds: oral contraceptive
Allergies: penicillin (rash as a child)
Family hx: mom — osteoarthritis (knees), dad — htn

Lifestyle: hiker (4-5 mi weekly). non-smoker. occasional wine.

— Provider notes (handwritten, transcribed) —
Pt amb without assist. Mild crepitus right knee on flex. McMurray equivocal. No effusion today. ROM 0–125, mild discomfort end ROM. Lachman neg. Anterior drawer neg.
Imp: likely early OA vs meniscal irritation. Order WB AP+lat right knee. Consider MRI if XR unrevealing & sx persist.
Plan: NSAIDs scheduled (naproxen 500mg BID with food x 2 weeks), PT referral for quad strengthening, rtc 4 weeks.
`;
