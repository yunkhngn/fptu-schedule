export type ShellData = {
  student: { name: string; initials: string; studentId: string };
  campus: string;
  unreadNotifications: number;
};

export type HomeData = {
  metrics: {
    status?: string;
    program?: string;
    email?: string;
    cohort?: string;
    balance?: string;
  };
  news: NewsItemData[];
  categories: string[];
};

export type NewsItemData = {
  id: string;
  title: string;
  category: string;
  publishedAt: string;
  href: string;
};

export type ClassSession = {
  id: string;
  date: string; /* yyyy-MM-dd */
  slot: number;
  time: string;
  courseCode: string;
  classCode?: string;
  mode: "online" | "offline";
  room?: string;
  lecturer?: string;
  attendance: "attended" | "absent" | "not-yet";
  meetUrl?: string;
};

export type ExamItem = {
  courseCode: string;
  courseName?: string;
  date: string;
  time: string;
  room?: string;
  form?: string;
  kind?: string;
};

export type PageData = { shell: ShellData } & (
  | { page: "overview"; home: HomeData }
  | { page: "timetable"; sessions: ClassSession[]; weekStart: string }
  | { page: "exams"; exams: ExamItem[] }
  | { page: "news"; news: NewsItemData[]; categories: string[] }
);

