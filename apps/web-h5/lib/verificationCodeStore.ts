type CodeRecord = {
  code: string;
  expiresAt: number;
};

export const verificationCodeStore = new Map<string, CodeRecord>();
