import type { JSX } from "react";
import { PageHeader } from "@/components/templates/PageHeader";
import { StatTile } from "@/components/molecules/StatTile";
import { Section } from "@/components/molecules/Section";
import { RichTable, type RichTableColumn } from "@/components/organisms/RichTable";
import { useLang, useT, type Lang } from "@/i18n";
import type { CurriculumData, ShellData } from "@/data/types";

export interface CurriculumProps {
  data: CurriculumData;
  shell: ShellData;
  lang?: Lang;
}

export function Curriculum({
  data,
  shell: _shell,
  lang: propLang,
}: CurriculumProps): JSX.Element {
  const contextLang = useLang();
  const lang = propLang || contextLang;
  const t = useT();

  const groups = data.groups || [];
  const totalCourses = groups.reduce((acc, g) => acc + (g.rows?.length || 0), 0);

  const columns: RichTableColumn[] = [
    { key: "code", header: lang === "en" ? "Course Code" : "Mã môn" },
    { key: "name", header: lang === "en" ? "Course Name" : "Tên môn học" },
    { key: "credit", header: lang === "en" ? "Credits" : "Tín chỉ", align: "center" },
    { key: "prerequisite", header: lang === "en" ? "Prerequisite" : "Tiên quyết" },
  ];

  return (
    <div className="space-y-6 pt-2">
      <PageHeader
        eyebrow={lang === "en" ? "Academics · Curriculum" : "Học tập · Khung đào tạo"}
        title={t("nav.curriculum_framework")}
        description={t("nav.curriculum_framework_desc")}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatTile
          label={lang === "en" ? "Total Semesters" : "Tổng số học kỳ"}
          value={groups.length}
        />
        <StatTile
          label={lang === "en" ? "Total Curriculum Courses" : "Tổng số môn trong khung"}
          value={totalCourses}
          tone="success"
        />
      </div>

      <div className="space-y-6">
        {groups.map((group) => {
          const rows: Array<Record<string, string>> = (group.rows || []).map((r) => ({
            code: r.code || "",
            name: r.name || "",
            credit: r.credit || "—",
            prerequisite: r.prerequisite || "None",
          }));

          return (
            <Section key={group.title} title={group.title}>
              <RichTable
                columns={columns}
                rows={rows}
                empty={lang === "en" ? "No courses in this semester" : "Không có môn nào trong kỳ này"}
              />
            </Section>
          );
        })}
      </div>
    </div>
  );
}
