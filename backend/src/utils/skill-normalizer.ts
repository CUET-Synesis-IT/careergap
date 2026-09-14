const skillNormalization: Record<string, string> = {
  node: "Node.js",
  nodejs: "Node.js",

  postgres: "PostgreSQL",
  postgresql: "PostgreSQL",

  reactjs: "React",
  "react.js": "React",

  nextjs: "Next.js",
  "next.js": "Next.js",

  expressjs: "Express.js",
  "express.js": "Express.js",

  typescript: "TypeScript",
  javascript: "JavaScript",

  mongodb: "MongoDB",
  mongo: "MongoDB",

  docker: "Docker",
  kubernetes: "Kubernetes",

  redis: "Redis",
};

export function normalizeSkill(skill: string): string {
  const normalized = skill
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

  return skillNormalization[normalized] ?? skill.trim();
}

export function normalizeSkills(skills: string[]): string[] {
  const normalizedSkills = skills
    .map(normalizeSkill)
    .filter(Boolean);

  return [...new Set(normalizedSkills)];
}
