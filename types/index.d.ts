type AIPIdParameter = {
  params: Promise<{aipId: string}>
}

type ProjectIdParameter = {
  params: Promise<{projectId: string}>
}

type LGUAccount = {
  email: string,
  fullName: string,
  role: string,
  locale: string
};

type AuthParameters = {
  role: string,
  baseURL: string;
}