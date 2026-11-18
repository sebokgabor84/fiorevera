interface Props {
  email: string;
  className?: string;
}

/**
 * mailto link whose address may wrap only at the "@": the global Safety Layer lets links break
 * anywhere, which split "info.fiorevera@gmail.co / m" in a 212 px footer column (2026-11-09).
 * With the <wbr> the address stays whole when it fits and becomes "local / @domain" when it does
 * not — independent of any column ratio.
 */
export const EmailLink = ({ email, className }: Props) => {
  const at = email.indexOf('@');
  return (
    <a href={`mailto:${email}`} className={['email-link', className].filter(Boolean).join(' ')}>
      {email.slice(0, at)}
      <wbr />
      {email.slice(at)}
    </a>
  );
};
