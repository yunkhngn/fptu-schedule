import type { JSX } from "react";
import { PageHeader } from "@/components/templates/PageHeader";
import { Section } from "@/components/molecules/Section";
import { RichTable, type RichTableColumn } from "@/components/organisms/RichTable";
import { useLang, useT, type Lang } from "@/i18n";
import type { TransactionsData, ShellData } from "@/data/types";

export interface TransactionsProps {
  data: TransactionsData;
  shell: ShellData;
  lang?: Lang;
}

export function Transactions({
  data,
  shell: _shell,
  lang: propLang,
}: TransactionsProps): JSX.Element {
  const contextLang = useLang();
  const lang = propLang || contextLang;
  const t = useT();

  const columns: RichTableColumn[] = [
    { key: "date", header: lang === "en" ? "Receipt Date" : "Ngày biên lai" },
    { key: "description", header: lang === "en" ? "Description" : "Diễn giải" },
    {
      key: "amount",
      header: lang === "en" ? "Amount (VND)" : "Số tiền (VND)",
      align: "right",
      tone: (val) => (val.startsWith("-") ? "danger" : "success"),
    },
    {
      key: "status",
      header: lang === "en" ? "Status" : "Trạng thái",
      align: "center",
      tone: () => "success",
    },
  ];

  const rows: Array<Record<string, string>> = (data.rows || []).map((r) => ({
    date: r.date || "",
    description: r.description || "",
    amount: r.amount || "0",
    status: r.status || (lang === "en" ? "Completed" : "Thành công"),
  }));

  return (
    <div className="space-y-6 pt-2">
      <PageHeader
        eyebrow={lang === "en" ? "Finance · Transactions" : "Tài chính · Giao dịch"}
        title={lang === "en" ? "Transactions" : "Giao dịch"}
        description={
          lang === "en"
            ? "Your historical payments, wallet deposits and tuition transactions."
            : "Lịch sử nộp tiền, đóng học phí và các giao dịch tài chính của bạn."
        }
      />

      <Section title={lang === "en" ? "Transaction History" : "Lịch sử giao dịch"}>
        <RichTable
          columns={columns}
          rows={rows}
          empty={lang === "en" ? "No transactions found" : "Không có giao dịch nào"}
        />
      </Section>
    </div>
  );
}
