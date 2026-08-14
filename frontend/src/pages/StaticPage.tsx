import { useEffect, useState } from 'react';
import api from '../api/client';
import type { Page } from '../api/types';

export default function StaticPage({ slug }: { slug: string }) {
  const [page, setPage] = useState<Page | null>(null);

  useEffect(() => {
    api.get(`/pages/${slug}`).then((r) => setPage(r.data));
  }, [slug]);

  if (!page) return <div className="container page-pad">Loading...</div>;

  return (
    <div className="container page-pad page-prose">
      <h1 className="section-title">{page.title}</h1>
      <div className="page-prose-body" dangerouslySetInnerHTML={{ __html: page.content }} />
    </div>
  );
}
