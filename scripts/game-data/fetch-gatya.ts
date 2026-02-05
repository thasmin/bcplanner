import crypto from "crypto";

export type Language = "jp" | "en" | "tw" | "kr";

interface ClientInfo {
  client: { countryCode: string; version: string };
  device: { model: string };
  os: { type: string; version: string };
}

export class NyankoAuth {
  private inquiryCode: string;
  private password?: string;
  private timestamp: number;
  private nonce: string;
  private signaturePrefix: string;

  constructor(inquiryCode?: string) {
    this.inquiryCode = inquiryCode || process.env.INQUIRY_CODE || "";
    this.timestamp = Math.floor(Date.now() / 1000);
    this.nonce = this.randomHex(16);
    this.signaturePrefix = this.randomHex(32);
  }

  private randomHex(bytes: number): string {
    return crypto.randomBytes(bytes).toString("hex");
  }

  private hmacSha256Hex(key: string, data: string): string {
    return crypto.createHmac("sha256", key).update(data).digest("hex");
  }

  private generateSignature(payload: string): string {
    return (
      this.signaturePrefix +
      this.hmacSha256Hex(this.inquiryCode + this.signaturePrefix, payload)
    );
  }

  private generateHeaders(payload: string): Record<string, string> {
    return {
      "Nyanko-Signature": this.generateSignature(payload),
      "Nyanko-Signature-Version": "1",
      "Nyanko-Signature-Algorithm": "HMACSHA256",
      "Nyanko-Timestamp": this.timestamp.toString(),
      "User-Agent":
        "Dalvik/2.1.0 (Linux; U; Android 12; moto e22 Build/SOVS32.121-40-2)",
      "Content-Type": "application/json",
    };
  }

  private basePayload(): Record<string, string> {
    return {
      accountCode: this.inquiryCode,
      nonce: this.nonce,
    };
  }

  async generateInquiryCode(): Promise<string> {
    const url =
      "https://nyanko-backups.ponosgames.com/?action=createAccount&referenceId=";
    const response = await fetch(url);
    const data = await response.json();
    this.inquiryCode = data.accountId;
    return this.inquiryCode;
  }

  async generatePassword(): Promise<string> {
    const payload = JSON.stringify({
      ...this.basePayload(),
      accountCreatedAt: this.timestamp,
    });

    const response = await fetch(
      "https://nyanko-auth.ponosgames.com/v1/users",
      {
        method: "POST",
        headers: this.generateHeaders(payload),
        body: payload,
      },
    );

    const data = await response.json();
    this.password = data.payload.password;
    return this.password;
  }

  async generateJwt(versionId: string): Promise<string> {
    if (!this.password) {
      throw new Error("Password not generated. Call generatePassword() first.");
    }

    const clientInfo: ClientInfo = {
      client: { countryCode: "en", version: versionId },
      device: { model: "moto e22" },
      os: { type: "android", version: "12.0.0" },
    };

    const payload = JSON.stringify({
      ...this.basePayload(),
      clientInfo,
      password: this.password,
    });

    const response = await fetch(
      "https://nyanko-auth.ponosgames.com/v1/tokens",
      {
        method: "POST",
        headers: this.generateHeaders(payload),
        body: payload,
      },
    );

    const data = await response.json();
    return data.payload.token;
  }

  static eventUrl(lang: Language, jwt: string, file = "gatya.tsv"): string {
    const baseUri = "https://nyanko-events.ponosgames.com";
    const kind = "_production";

    if (lang === "jp") {
      return `${baseUri}/battlecats${kind}/${file}?jwt=${jwt}`;
    }
    return `${baseUri}/battlecats${lang}${kind}/${file}?jwt=${jwt}`;
  }

  static async fetchEvents(
    lang: Language,
    jwt: string,
    file = "gatya.tsv",
  ): Promise<string> {
    const url = this.eventUrl(lang, jwt, file);
    const response = await fetch(url);
    return response.text();
  }
}

export function versionToId(version: string): string {
  return version
    .split(".")
    .map((n) => n.padStart(2, "0"))
    .join("");
}

/**
 * Fetch gatya.tsv from Ponos servers for a given language and game version.
 * This authenticates with the Ponos API and downloads the current event data.
 */
export async function fetchGatyaTsv(
  lang: Language,
  version: string,
): Promise<string> {
  const versionId = versionToId(version);

  const auth = new NyankoAuth();

  // Step 1: Generate inquiry code
  await auth.generateInquiryCode();

  // Step 2: Generate password
  await auth.generatePassword();

  // Step 3: Generate JWT
  const jwt = await auth.generateJwt(versionId);

  // Step 4: Fetch gatya.tsv
  return NyankoAuth.fetchEvents(lang, jwt);
}

async function main() {
  const lang: Language = (process.argv[2] as Language) || "en";
  const version = process.argv[3];
  if (!version) {
    console.error("Usage: bun run fetch-gatya.ts <lang> <version>");
    console.error("Example: bun run fetch-gatya.ts en 15.1.0");
    process.exit(1);
  }
  const versionId = versionToId(version);

  console.error(`Fetching gatya.tsv for ${lang} (version ${version})...`);

  const auth = new NyankoAuth();

  // Step 1: Generate inquiry code
  console.error("Generating inquiry code...");
  await auth.generateInquiryCode();

  // Step 2: Generate password
  console.error("Generating password...");
  await auth.generatePassword();

  // Step 3: Generate JWT
  console.error("Generating JWT...");
  const jwt = await auth.generateJwt(versionId);

  // Step 4: Fetch gatya.tsv
  console.error("Fetching gatya.tsv...");
  const tsv = await NyankoAuth.fetchEvents(lang, jwt);

  console.log(tsv);
}

// Only run main when executed directly, not when imported
if (import.meta.main) {
  main().catch(console.error);
}
