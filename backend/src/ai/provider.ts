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

export interface AIProvider {
  generateCareerProfile(
    input: CareerProfileGenerationInput,
  ): Promise<CareerProfileGenerationResult>;
}
