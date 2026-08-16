import { supabaseAdmin } from "../config/supabase.js";
import type { Notification, NotificationRow, NotificationType } from "../types/family.js";

export class NotificationError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "NotificationError";
  }
}

function mapNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    metadata: row.metadata ?? {},
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

export type CreateNotificationParams = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
};

export async function createNotification(params: CreateNotificationParams): Promise<Notification> {
  const { data, error } = await supabaseAdmin
    .from("notifications")
    .insert({
      user_id: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      metadata: params.metadata ?? {},
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new NotificationError(error?.message ?? "Failed to create notification", 500, "INTERNAL_ERROR");
  }

  return mapNotification(data as NotificationRow);
}

export async function listUnreadNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabaseAdmin
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .eq("is_read", false)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new NotificationError(error.message, 500, "INTERNAL_ERROR");
  }

  return (data ?? []).map((row) => mapNotification(row as NotificationRow));
}

export async function markNotificationRead(notificationId: string, userId: string): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new NotificationError(error.message, 500, "INTERNAL_ERROR");
  }

  if (!data) {
    throw new NotificationError("Notification not found", 404, "NOTIFICATION_NOT_FOUND");
  }
}

export async function hasRecentDuplicateNotification(params: {
  userId: string;
  type: NotificationType;
  metadataKey: string;
  metadataValue: string;
  withinMinutes?: number;
}): Promise<boolean> {
  const since = new Date(
    Date.now() - (params.withinMinutes ?? 5) * 60 * 1000,
  ).toISOString();

  const { data, error } = await supabaseAdmin
    .from("notifications")
    .select("id, metadata")
    .eq("user_id", params.userId)
    .eq("type", params.type)
    .eq("is_read", false)
    .gte("created_at", since)
    .limit(20);

  if (error) {
    throw new NotificationError(error.message, 500, "INTERNAL_ERROR");
  }

  return (data ?? []).some(
    (row) =>
      (row.metadata as Record<string, unknown>)?.[params.metadataKey] === params.metadataValue,
  );
}
