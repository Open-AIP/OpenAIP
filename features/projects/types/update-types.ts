export type ProjectUpdate = {
  id: string;
  projectRefCode: string;

  title: string;
  date: string;
  description: string;

  progressPercent?: number;
  attendanceCount?: number;
  photoUrls?: string[];
};
