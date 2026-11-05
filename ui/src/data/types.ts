export type ShellData = {
  student: { name: string; initials: string; studentId: string };
  campus: string;
  unreadNotifications: number;
};

export type TopbarCampus = {
  name: string;
  code: string;
  isMain: boolean;
};

export type TopbarLanguageOption = {
  culture: string;
  label: string;
};

export type TopbarLanguage = {
  current: string;
  options: TopbarLanguageOption[];
};

export type TopbarNotifications = {
  unread: number;
  available: boolean;
};

export type TopbarProfile = {
  name: string;
  studentId: string;
  accountHref: string;
  canLogout: boolean;
};

export type TopbarData = {
  campus: TopbarCampus | null;
  language: TopbarLanguage | null;
  notifications: TopbarNotifications | null;
  profile: TopbarProfile | null;
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

