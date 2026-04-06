import { useEffect } from 'react';

interface SeoOptions {
  title: string;
  description: string;
  image?: string;
  canonicalPath?: string;
}

function ensureMetaByName(name: string) {
  let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  return el;
}

function ensureMetaByProperty(property: string) {
  let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  return el;
}

function ensureCanonical() {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  return el;
}

export function useSeo({ title, description, image, canonicalPath }: SeoOptions) {
  useEffect(() => {
    document.title = title;

    ensureMetaByName('description').setAttribute('content', description);
    ensureMetaByProperty('og:title').setAttribute('content', title);
    ensureMetaByProperty('og:description').setAttribute('content', description);
    ensureMetaByName('twitter:title').setAttribute('content', title);
    ensureMetaByName('twitter:description').setAttribute('content', description);

    const imageUrl = image || 'https://lovable.dev/opengraph-image-p98pqg.png';
    ensureMetaByProperty('og:image').setAttribute('content', imageUrl);
    ensureMetaByName('twitter:image').setAttribute('content', imageUrl);

    const canonical = ensureCanonical();
    canonical.href = canonicalPath
      ? `${window.location.origin}${canonicalPath}`
      : window.location.href;
  }, [title, description, image, canonicalPath]);
}
