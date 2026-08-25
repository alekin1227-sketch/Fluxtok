import { CreatorStatus, SampleStatus, ContentKind } from "@prisma/client";

export const creatorStatusLabel: Record<CreatorStatus, string> = {
  FOUND: "Encontrado",
  CONTACTED: "Contatado",
  RESPONDED: "Respondeu",
  INTERESTED: "Interessado",
  PARTNERSHIP_ACCEPTED: "Parceria aceita",
  ACTIVE_COLLABORATION: "Colaboração ativa",
  FINISHED: "Finalizado",
  NOT_INTERESTED: "Não interessado",
};

export const sampleStatusLabel: Record<SampleStatus, string> = {
  PREPARING: "Separando",
  SENT: "Enviada",
  IN_TRANSIT: "Em transporte",
  RECEIVED: "Recebida",
  WAITING_CONTENT: "Aguardando conteúdo",
  CONTENT_PUBLISHED: "Conteúdo publicado",
  CANCELED: "Cancelada",
};

export const contentKindLabel: Record<ContentKind, string> = {
  VIDEO: "Vídeo",
  LIVE: "LIVE",
  OTHER: "Outro",
};

export function creatorTone(status: CreatorStatus) {
  if (status === "ACTIVE_COLLABORATION" || status === "PARTNERSHIP_ACCEPTED") return "success";
  if (status === "NOT_INTERESTED") return "danger";
  if (status === "FINISHED") return "neutral";
  return "brand";
}

export function sampleTone(status: SampleStatus) {
  if (status === "CONTENT_PUBLISHED") return "success";
  if (status === "WAITING_CONTENT") return "warning";
  if (status === "CANCELED") return "danger";
  return "brand";
}
