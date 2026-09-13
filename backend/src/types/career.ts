export type SkillImportance = "HIGH" | "MEDIUM" | "LOW";

export interface CareerSkill {
  name: string;
  importance: SkillImportance;
}

export interface CareerProfile {
  skills: CareerSkill[];
}

export interface CareerResponse {
  id: string;
  slug: string;
  name: string;
  description: string;
}
