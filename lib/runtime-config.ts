const requiredEnvironment = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'] as const;

let isValidated = false;

export function validateRuntimeConfig() {
  if (isValidated) return;

  for (const name of requiredEnvironment) {
    if (!process.env[name]?.trim()) {
      throw new Error(`Missing required environment variable: ${name}`);
    }
  }

  const databaseUrlValue = process.env.DATABASE_URL;
  const authUrlValue = process.env.NEXTAUTH_URL;
  if (!databaseUrlValue || !authUrlValue) {
    throw new Error('Required environment variables are missing.');
  }

  const databaseUrl = new URL(databaseUrlValue);
  if (!['postgres:', 'postgresql:'].includes(databaseUrl.protocol)) {
    throw new Error('DATABASE_URL must use the PostgreSQL protocol.');
  }

  new URL(authUrlValue);
  if ((process.env.NEXTAUTH_SECRET?.length ?? 0) < 32) {
    throw new Error('NEXTAUTH_SECRET must be at least 32 characters long.');
  }

  isValidated = true;
}
