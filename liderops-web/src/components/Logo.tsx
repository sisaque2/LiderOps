interface LogoProps {
  tamanho?: number;
  className?: string;
}

// Caixa de papelão em perspectiva: mesmo desenho usado no favicon (public/favicon.svg)
export default function Logo({ tamanho = 28, className = '' }: LogoProps) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect width="32" height="32" rx="7" fill="#0f172a" />
      <g fill="none" stroke="#8BC53F" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
        <path d="M16 5.5 26 10.5v11L16 26.5 6 21.5v-11z" />
        <path d="M6 10.5l10 5 10-5M16 15.5v11" />
        <path d="M11 8l10 5" />
      </g>
    </svg>
  );
}
