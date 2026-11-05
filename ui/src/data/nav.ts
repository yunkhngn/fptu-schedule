import {
  CalendarDays,
  CalendarClock,
  BarChart3,
  ClipboardCheck,
  Table2,
  Briefcase,
  GraduationCap,
  BookOpen,
  BookMarked,
  ListOrdered,
  Award,
  Newspaper,
  FolderOpen,
  FileText,
  FilePlus2,
  Repeat2,
  Rocket,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavLeaf = {
  title: string;
  to: string;
  icon: LucideIcon;
  description?: string;
};

export type NavItem = NavLeaf | { title: string; icon: LucideIcon; children: NavLeaf[] };

export type NavGroup = { label: string; items: NavItem[] };

export const isParent = (
  item: NavItem
): item is { title: string; icon: LucideIcon; children: NavLeaf[] } => "children" in item;

export const FAP_URLS: Record<string, string> = {
  "/": "/",
  "/thoi-khoa-bieu": "/WeeklyTimetable",
  "/lich-thi": "/ExamSchedule",
  "/tin-tuc": "/News",
  "/bao-cao-diem-danh": "/Report/Attendance",
  "/bao-cao-diem": "/Report/Grade",
  "/bang-diem": "/Report/Transcript",
  "/dieu-kien-ojt": "/Report/OjtConditions",
  "/dieu-kien-kltn": "/Report/ThesisConditions",
  "/mon-hoc": "/Subject",
  "/khung-chuong-trinh": "/Curriculum",
  "/chung-chi": "/MyCertificates",
  "/tai-lieu": "/Document",
  "/xem-don": "/Application",
  "/gui-don": "/Application/Catalog",
  "/don-doi-lop-cheo": "/CrossClassChange",
  "/don-khoi-nghiep": "/StartupGroup",
  "/thanh-toan": "/Transaction",
  "/wishlist": "/Wishlist",
  "/ho-so-sinh-vien": "/StudentProfile",
};

export function navHref(route: string): string {
  return FAP_URLS[route] || route;
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Học tập",
    items: [
      {
        title: "Lịch học",
        icon: CalendarDays,
        children: [
          { title: "Thời khóa biểu", to: "/thoi-khoa-bieu", icon: CalendarDays },
          { title: "Lịch thi", to: "/lich-thi", icon: CalendarClock },
        ],
      },
      {
        title: "Báo cáo học tập",
        icon: BarChart3,
        children: [
          {
            title: "Báo cáo điểm danh",
            to: "/bao-cao-diem-danh",
            icon: ClipboardCheck,
            description: "Theo dõi tình trạng điểm danh theo từng môn học và từng buổi.",
          },
          {
            title: "Báo cáo điểm",
            to: "/bao-cao-diem",
            icon: BarChart3,
            description: "Điểm thành phần và điểm tổng kết của các môn trong học kỳ.",
          },
          {
            title: "Bảng điểm",
            to: "/bang-diem",
            icon: Table2,
            description: "Bảng điểm toàn khóa học theo từng học kỳ.",
          },
          {
            title: "Điều kiện OJT",
            to: "/dieu-kien-ojt",
            icon: Briefcase,
            description: "Kiểm tra điều kiện tham gia kỳ thực tập (On-the-Job Training).",
          },
          {
            title: "Điều kiện KLTN",
            to: "/dieu-kien-kltn",
            icon: GraduationCap,
            description: "Kiểm tra điều kiện làm khóa luận tốt nghiệp.",
          },
        ],
      },
      {
        title: "Môn học & chương trình",
        icon: BookOpen,
        children: [
          {
            title: "Môn học",
            to: "/mon-hoc",
            icon: BookMarked,
            description: "Danh sách môn học và thông tin đề cương.",
          },
          {
            title: "Khung chương trình",
            to: "/khung-chuong-trinh",
            icon: ListOrdered,
            description: "Khung chương trình đào tạo theo mã chương trình của bạn.",
          },
        ],
      },
      {
        title: "Chứng chỉ",
        to: "/chung-chi",
        icon: Award,
        description: "Các chứng chỉ bạn đã đạt được trong quá trình học.",
      },
      {
        title: "Tin tức & tài liệu",
        icon: Newspaper,
        children: [
          { title: "Tin tức", to: "/tin-tuc", icon: Newspaper },
          {
            title: "Tài liệu",
            to: "/tai-lieu",
            icon: FolderOpen,
            description: "Tài liệu, biểu mẫu và hướng dẫn dành cho sinh viên.",
          },
        ],
      },
    ],
  },
  {
    label: "Đơn từ",
    items: [
      {
        title: "Xem đơn",
        to: "/xem-don",
        icon: FileText,
        description: "Theo dõi trạng thái xử lý các đơn bạn đã gửi.",
      },
      { title: "Gửi đơn", to: "/gui-don", icon: FilePlus2 },
      {
        title: "Đơn đổi lớp chéo",
        to: "/don-doi-lop-cheo",
        icon: Repeat2,
        description: "Gửi và theo dõi yêu cầu đổi lớp chéo với sinh viên khác.",
      },
      {
        title: "Đơn khởi nghiệp",
        to: "/don-khoi-nghiep",
        icon: Rocket,
        description: "Đăng ký và theo dõi đơn tham gia chương trình khởi nghiệp.",
      },
    ],
  },
  {
    label: "Tài chính",
    items: [
      {
        title: "Thanh toán",
        to: "/thanh-toan",
        icon: Wallet,
        description: "Số dư tài khoản, học phí và lịch sử giao dịch.",
      },
    ],
  },
];
