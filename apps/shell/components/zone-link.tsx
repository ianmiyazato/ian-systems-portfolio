import Link from 'next/link';
import type { AnchorHTMLAttributes, ReactNode } from 'react';

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { href: string; children: ReactNode };

/** System design story pages are static Astro in the shop zone. */
const storyPage = (href: string) => /^\/system-design(\/|$|\?)/.test(href);

/** Links into other zones are full navigations; in-zone links use the Next router without prefetch noise. */
export function ZLink({ href, children, ...rest }: Props) {
  if (/^\/(mare|pulse)(\/|$|\?)/.test(href) || storyPage(href)) return <a href={href} {...rest}>{children}</a>;
  return <Link href={href} prefetch={false} {...rest}>{children}</Link>;
}
