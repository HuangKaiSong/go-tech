import type { UrlObject } from 'node:url';
import type { PackageBizCode } from '@go-tech/types';

const externalHrefPattern = /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i;

const appendProductToSearch = (search: string, product: PackageBizCode) => {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  if (!params.has('product')) params.set('product', product);

  return `?${params.toString()}`;
};

const appendProductToStringHref = (href: string, product: PackageBizCode) => {
  if (externalHrefPattern.test(href)) return href;

  const hashIndex = href.indexOf('#');
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : '';
  const hrefWithoutHash = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
  const queryIndex = hrefWithoutHash.indexOf('?');
  const pathname = queryIndex >= 0 ? hrefWithoutHash.slice(0, queryIndex) : hrefWithoutHash;
  const search = queryIndex >= 0 ? hrefWithoutHash.slice(queryIndex) : '';

  return `${pathname}${appendProductToSearch(search, product)}${hash}`;
};

export function withProductQuery(href: string, product?: PackageBizCode): string;
export function withProductQuery(href: UrlObject, product?: PackageBizCode): UrlObject;
export function withProductQuery(href: string | UrlObject, product?: PackageBizCode): string | UrlObject;
export function withProductQuery(href: string | UrlObject, product?: PackageBizCode): string | UrlObject {
  if (!product) return href;
  if (typeof href === 'string') return appendProductToStringHref(href, product);
  if (href.protocol || href.host || href.hostname) return href;

  if (href.search) {
    return {
      ...href,
      search: appendProductToSearch(href.search, product)
    };
  }

  if (typeof href.query === 'string') {
    return {
      ...href,
      query: appendProductToSearch(href.query, product).slice(1)
    };
  }

  if (href.query?.product !== undefined) return href;

  return {
    ...href,
    query: {
      ...href.query,
      product
    }
  };
}
