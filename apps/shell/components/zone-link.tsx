import Link from 'next/link';
import type { AnchorHTMLAttributes, ReactNode } from 'react';

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { href: string; children: ReactNode };

/** Links into other zones are full navigations; in-zone links use the Next router without prefetch noise. */
export function ZLink({ href, children, ...rest }: Props) {
  if (/^\/(mare|pulse)(\/|$|\?)/.test(href)) return <a href={href} {...rest}>{children}</a>;
  return <Link href={href} prefetch={false} {...rest}>{children}</Link>;
}
