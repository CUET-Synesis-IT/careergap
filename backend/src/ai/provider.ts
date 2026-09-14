export interface CareerProfileGenerationInput {
  careerName: string;
  careerDescription: string;
}

export interface CareerProfileGenerationResult {
  skills: Array<{
    name: string;
    importance: "HIGH" | "MEDIUM" | "LOW";
  }>;
}

export interface ResumeSkillExtractionInput {
  resumeText: string;
}

export interface ResumeSkillExtractionResult {
  skills: string[];
}

export interface AIProvider {
  generateCareerProfile(
    input: CareerProfileGenerationInput,
  ): Promise<CareerProfileGenerationResult>;

  extractResumeSkills(
    input: ResumeSkillExtractionInput,
  ): Promise<ResumeSkillExtractionResult>;
}
