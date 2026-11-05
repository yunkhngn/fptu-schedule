import { NAV_GROUPS, navHref, isParent } from "@/data/nav";

export interface SearchTarget {
  title: string;
  group: string;
  href: string;
  description?: string;
}

export function removeDiacritics(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .trim();
}

export function searchTargets(): SearchTarget[] {
  const targets: SearchTarget[] = [];

  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (isParent(item)) {
        for (const child of item.children) {
          targets.push({
            title: child.title,
            group: group.label,
            href: navHref(child.to),
            description: child.description,
          });
        }
      } else {
        targets.push({
          title: item.title,
          group: group.label,
          href: navHref(item.to),
          description: item.description,
        });
      }
    }
  }

  return targets;
}

export function filterTargets(query: string, targets: SearchTarget[]): SearchTarget[] {
  const cleanQuery = removeDiacritics(query);
  if (!cleanQuery) return targets;

  const tokens = cleanQuery.split(/\s+/).filter(Boolean);

  const scored: Array<{ target: SearchTarget; score: number }> = [];

  for (const target of targets) {
    const cleanTitle = removeDiacritics(target.title);
    const cleanGroup = removeDiacritics(target.group);
    const cleanDesc = removeDiacritics(target.description || "");

    const haystack = `${cleanTitle} ${cleanGroup} ${cleanDesc}`;

    // All tokens must be present in haystack
    const matchesAll = tokens.every((token) => haystack.includes(token));
    if (!matchesAll) continue;

    // Scoring: lower number = better ranking
    let score = 100;

    // Exact title starts with query
    if (cleanTitle.startsWith(cleanQuery)) {
      score = 0;
    } else if (cleanTitle.includes(cleanQuery)) {
      score = 10 + cleanTitle.indexOf(cleanQuery);
    } else {
      // Check title contains all tokens
      const titleMatchesAll = tokens.every((token) => cleanTitle.includes(token));
      if (titleMatchesAll) {
        score = 30 + cleanTitle.indexOf(tokens[0]);
      } else {
        score = 60;
      }
    }

    scored.push({ target, score });
  }

  scored.sort((a, b) => a.score - b.score);
  return scored.map((item) => item.target);
}
