/**
 * Contrato reservado para uma futura integração oficial com TikTok Shop.
 * O MVP não faz chamadas externas; todos os dados continuam manuais.
 */
export interface TikTokShopProvider {
  syncCreators(companyId: string): Promise<void>;
  syncSamples(companyId: string): Promise<void>;
  syncContents(companyId: string): Promise<void>;
}
