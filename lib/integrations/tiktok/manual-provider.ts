import type { TikTokShopProvider } from "./provider";

/** MVP: provider nulo/manual. Mantém a arquitetura desacoplada sem implementar API. */
export class ManualTikTokShopProvider implements TikTokShopProvider {
  async syncCreators() { return; }
  async syncSamples() { return; }
  async syncContents() { return; }
}
