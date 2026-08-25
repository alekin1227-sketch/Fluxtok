export function Brand({ compact = false, dark = false }: { compact?: boolean; dark?: boolean }) {
  return <a href="/" className={`fluxtok-brand ${compact ? "brand-compact" : ""} ${dark ? "brand-on-dark" : ""}`}>
    <img src="/brand/fluxtok-icon.png" alt="" className="fluxtok-icon" />
    {!compact && <span>Flux<span>tok</span></span>}
  </a>;
}
