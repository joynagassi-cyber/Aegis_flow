interface LogoProps {
  size?: number;
}

export function Logo({ size = 32 }: LogoProps) {
  return (
    <img
      src="/assets/aegis-flow.png"
      alt="Aegis Flow"
      className="shrink-0"
      style={{ width: size, height: size }}
    />
  );
}
