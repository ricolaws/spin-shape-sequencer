export function getNoteDisplay(noteValue: number): string {
  if (noteValue === 0) return "✖︎";

  const noteNames = [
    "C",
    "C♯",
    "D",
    "D♯",
    "E",
    "F",
    "F♯",
    "G",
    "G♯",
    "A",
    "A♯",
    "B",
  ];
  const noteName = noteNames[noteValue % 12];
  const octave = Math.floor(noteValue / 12) - 2;
  return `${noteName}${octave}`;
}
