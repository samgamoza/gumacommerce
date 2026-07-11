import { randomBytes } from "node:crypto";
import { and, desc, eq, inArray, gt } from "drizzle-orm";
import { getDb } from "../client";
import { kycDocuments, kycVerificationSessions } from "../schema/index";
import { updateTenantSettings } from "./tenant-settings";

export type KycStatus = "draft" | "in_progress" | "submitted" | "approved" | "rejected";
export type KycIdPath = "primary" | "secondary";
export type KycDocType = "primary_id" | "secondary_id_1" | "secondary_id_2" | "selfie";

export interface KycDocumentRecord {
  id: string;
  docType: KycDocType;
  idCategory: string | null;
  mimeType: string;
  createdAt: Date;
}

export interface KycSessionRecord {
  id: string;
  tenantId: string;
  token: string;
  status: KycStatus;
  idPath: KycIdPath | null;
  primaryIdType: string | null;
  secondaryIdType1: string | null;
  secondaryIdType2: string | null;
  rejectionReason: string | null;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  documents: KycDocumentRecord[];
}

const ACTIVE_STATUSES: KycStatus[] = ["draft", "in_progress", "submitted"];

function newToken(): string {
  return randomBytes(24).toString("base64url");
}

function expiryDate(): Date {
  const d = new Date();
  d.setHours(d.getHours() + 24);
  return d;
}

function mapSession(
  row: typeof kycVerificationSessions.$inferSelect,
  documents: KycDocumentRecord[] = []
): KycSessionRecord {
  return {
    id: row.id,
    tenantId: row.tenantId,
    token: row.token,
    status: row.status as KycStatus,
    idPath: row.idPath as KycIdPath | null,
    primaryIdType: row.primaryIdType,
    secondaryIdType1: row.secondaryIdType1,
    secondaryIdType2: row.secondaryIdType2,
    rejectionReason: row.rejectionReason,
    submittedAt: row.submittedAt,
    reviewedAt: row.reviewedAt,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    documents,
  };
}

async function loadDocuments(sessionId: string): Promise<KycDocumentRecord[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(kycDocuments)
    .where(eq(kycDocuments.sessionId, sessionId));
  return rows.map((row) => ({
    id: row.id,
    docType: row.docType as KycDocType,
    idCategory: row.idCategory,
    mimeType: row.mimeType,
    createdAt: row.createdAt,
  }));
}

export async function getLatestKycSession(tenantId: string): Promise<KycSessionRecord | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(kycVerificationSessions)
    .where(eq(kycVerificationSessions.tenantId, tenantId))
    .orderBy(desc(kycVerificationSessions.createdAt))
    .limit(1);
  if (!row) return null;
  const documents = await loadDocuments(row.id);
  return mapSession(row, documents);
}

export async function getActiveKycSession(tenantId: string): Promise<KycSessionRecord | null> {
  const db = getDb();
  const now = new Date();
  const [row] = await db
    .select()
    .from(kycVerificationSessions)
    .where(
      and(
        eq(kycVerificationSessions.tenantId, tenantId),
        inArray(kycVerificationSessions.status, ACTIVE_STATUSES),
        gt(kycVerificationSessions.expiresAt, now)
      )
    )
    .orderBy(desc(kycVerificationSessions.createdAt))
    .limit(1);
  if (!row) return null;
  const documents = await loadDocuments(row.id);
  return mapSession(row, documents);
}

export async function createKycSession(tenantId: string): Promise<KycSessionRecord> {
  const db = getDb();
  const now = new Date();
  const [row] = await db
    .insert(kycVerificationSessions)
    .values({
      tenantId,
      token: newToken(),
      status: "draft",
      expiresAt: expiryDate(),
    })
    .returning();
  return mapSession(row!, []);
}

export async function getOrCreateActiveKycSession(tenantId: string): Promise<KycSessionRecord> {
  const existing = await getActiveKycSession(tenantId);
  if (existing) return existing;
  return createKycSession(tenantId);
}

export async function getKycSessionByToken(token: string): Promise<KycSessionRecord | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(kycVerificationSessions)
    .where(eq(kycVerificationSessions.token, token))
    .limit(1);
  if (!row) return null;
  if (row.expiresAt < new Date() && row.status !== "approved") return null;
  const documents = await loadDocuments(row.id);
  return mapSession(row, documents);
}

export async function getKycSessionById(
  tenantId: string,
  sessionId: string
): Promise<KycSessionRecord | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(kycVerificationSessions)
    .where(
      and(
        eq(kycVerificationSessions.id, sessionId),
        eq(kycVerificationSessions.tenantId, tenantId)
      )
    )
    .limit(1);
  if (!row) return null;
  const documents = await loadDocuments(row.id);
  return mapSession(row, documents);
}

export async function updateKycSession(params: {
  sessionId: string;
  tenantId: string;
  idPath?: KycIdPath;
  primaryIdType?: string | null;
  secondaryIdType1?: string | null;
  secondaryIdType2?: string | null;
  status?: KycStatus;
}): Promise<KycSessionRecord | null> {
  const db = getDb();
  const now = new Date();
  const patch: Record<string, unknown> = {
    expiresAt: expiryDate(),
    updatedAt: now,
  };
  if (params.idPath !== undefined) {
    patch.idPath = params.idPath;
    patch.status = "in_progress";
  }
  if (params.primaryIdType !== undefined) patch.primaryIdType = params.primaryIdType;
  if (params.secondaryIdType1 !== undefined) patch.secondaryIdType1 = params.secondaryIdType1;
  if (params.secondaryIdType2 !== undefined) patch.secondaryIdType2 = params.secondaryIdType2;
  if (params.status !== undefined) patch.status = params.status;

  const [row] = await db
    .update(kycVerificationSessions)
    .set(patch)
    .where(
      and(
        eq(kycVerificationSessions.id, params.sessionId),
        eq(kycVerificationSessions.tenantId, params.tenantId),
        inArray(kycVerificationSessions.status, ["draft", "in_progress"])
      )
    )
    .returning();
  if (!row) return null;
  const documents = await loadDocuments(row.id);
  return mapSession(row, documents);
}

export async function upsertKycDocument(params: {
  sessionId: string;
  tenantId: string;
  docType: KycDocType;
  idCategory?: string | null;
  storageKey: string;
  mimeType: string;
}): Promise<KycDocumentRecord> {
  const db = getDb();
  const now = new Date();

  await db
    .update(kycVerificationSessions)
    .set({ status: "in_progress", expiresAt: expiryDate(), updatedAt: now })
    .where(
      and(
        eq(kycVerificationSessions.id, params.sessionId),
        eq(kycVerificationSessions.tenantId, params.tenantId)
      )
    );

  const [row] = await db
    .insert(kycDocuments)
    .values({
      sessionId: params.sessionId,
      tenantId: params.tenantId,
      docType: params.docType,
      idCategory: params.idCategory ?? null,
      storageKey: params.storageKey,
      mimeType: params.mimeType,
    })
    .onConflictDoUpdate({
      target: [kycDocuments.sessionId, kycDocuments.docType],
      set: {
        idCategory: params.idCategory ?? null,
        storageKey: params.storageKey,
        mimeType: params.mimeType,
        createdAt: now,
      },
    })
    .returning();

  return {
    id: row!.id,
    docType: row!.docType as KycDocType,
    idCategory: row!.idCategory,
    mimeType: row!.mimeType,
    createdAt: row!.createdAt,
  };
}

export class KycValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KycValidationError";
  }
}

export function validateKycSubmission(session: KycSessionRecord): void {
  if (!session.idPath) {
    throw new KycValidationError("Choose whether you are submitting a primary ID or two secondary IDs.");
  }

  const docTypes = new Set(session.documents.map((d) => d.docType));

  if (!docTypes.has("selfie")) {
    throw new KycValidationError("Upload a selfie holding your ID.");
  }

  if (session.idPath === "primary") {
    if (!session.primaryIdType) {
      throw new KycValidationError("Select your primary ID type.");
    }
    if (!docTypes.has("primary_id")) {
      throw new KycValidationError("Upload a clear photo of your primary ID.");
    }
    return;
  }

  if (!session.secondaryIdType1 || !session.secondaryIdType2) {
    throw new KycValidationError("Select both secondary ID types.");
  }
  if (session.secondaryIdType1 === session.secondaryIdType2) {
    throw new KycValidationError("Secondary IDs must be two different document types.");
  }
  if (!docTypes.has("secondary_id_1") || !docTypes.has("secondary_id_2")) {
    throw new KycValidationError("Upload photos of both secondary IDs.");
  }
}

export async function submitKycSession(
  tenantId: string,
  sessionId: string
): Promise<KycSessionRecord> {
  const session = await getKycSessionById(tenantId, sessionId);
  if (!session) throw new KycValidationError("Verification session not found.");
  if (!["draft", "in_progress"].includes(session.status)) {
    throw new KycValidationError("This verification session can no longer be submitted.");
  }

  validateKycSubmission(session);

  const db = getDb();
  const now = new Date();
  const [row] = await db
    .update(kycVerificationSessions)
    .set({
      status: "approved",
      submittedAt: now,
      reviewedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(kycVerificationSessions.id, sessionId),
        eq(kycVerificationSessions.tenantId, tenantId)
      )
    )
    .returning();

  await updateTenantSettings(tenantId, {
    settings: {
      wallet: {
        kycVerified: true,
        kycStatus: "approved",
        kycVerifiedAt: now.toISOString(),
      },
    },
  });

  const documents = await loadDocuments(row!.id);
  return mapSession(row!, documents);
}

export async function getKycDocumentStorageKey(
  tenantId: string,
  documentId: string
): Promise<{ storageKey: string; mimeType: string } | null> {
  const db = getDb();
  const [row] = await db
    .select({
      storageKey: kycDocuments.storageKey,
      mimeType: kycDocuments.mimeType,
    })
    .from(kycDocuments)
    .where(and(eq(kycDocuments.id, documentId), eq(kycDocuments.tenantId, tenantId)))
    .limit(1);
  return row ?? null;
}

export async function getKycDocumentByToken(
  token: string,
  documentId: string
): Promise<{ storageKey: string; mimeType: string; tenantId: string } | null> {
  const session = await getKycSessionByToken(token);
  if (!session) return null;

  const db = getDb();
  const [row] = await db
    .select({
      storageKey: kycDocuments.storageKey,
      mimeType: kycDocuments.mimeType,
      tenantId: kycDocuments.tenantId,
    })
    .from(kycDocuments)
    .where(
      and(eq(kycDocuments.id, documentId), eq(kycDocuments.sessionId, session.id))
    )
    .limit(1);
  return row ?? null;
}
