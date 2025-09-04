export function requireEnv(keys) {
  for (const k of keys) {
    if (!process.env[k]) {
      throw new Error(`Missing required env var: ${k}`);
    }
  }
}
