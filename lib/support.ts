import { SupportTicketStatus } from "@prisma/client";

export const supportStatusLabel: Record<SupportTicketStatus, string> = {
  OPEN: "Aberto",
  WAITING_SUPPORT: "Aguardando suporte",
  WAITING_CUSTOMER: "Aguardando cliente",
  CLOSED: "Encerrado",
};

export function supportTone(status: SupportTicketStatus) {
  if (status === "CLOSED") return "neutral";
  if (status === "WAITING_SUPPORT") return "warning";
  if (status === "WAITING_CUSTOMER") return "info";
  return "success";
}
