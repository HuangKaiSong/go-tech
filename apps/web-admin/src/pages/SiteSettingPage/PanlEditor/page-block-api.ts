export const savePageBlocks = async (page: string, blocks: unknown[]) => {
  const response = await fetch('/h5-hook/api/page-blocks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ page, blocks })
  });
  if (!response.ok) throw new Error('Save request failed');
  const result: unknown = await response.json();
  if (!result || typeof result !== 'object' || !('ok' in result) || result.ok !== true) {
    throw new Error('Save was not confirmed');
  }
};
