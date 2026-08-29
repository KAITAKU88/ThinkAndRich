export function Badge({
  variant: _v,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: string }) {
  return <span {...props} />;
}
