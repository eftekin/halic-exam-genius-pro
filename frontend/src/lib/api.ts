// Times are Istanbul wall clock exactly as the Excel states them; never convert time zones.
export interface Exam {
  id: string;
  code: string;
  name: string;
  search_code: string;
  date: string;
  start: string;
  end: string;
  rooms: string[];
  section?: string;
  program?: string;
}

export async function fetchExams(): Promise<Exam[]> {
  const res = await fetch("/data/exams.json");
  if (!res.ok) {
    throw new Error(`Failed to load exams (${res.status})`);
  }
  const data: { exams: Exam[] } = await res.json();
  return data.exams;
}
