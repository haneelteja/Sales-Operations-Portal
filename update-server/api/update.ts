import type { VercelRequest, VercelResponse } from '@vercel/node';

const REPO = 'haneelteja/Sales-Operations-Portal';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { target, arch, version } = req.query as Record<string, string>;

  if (!target || !arch || !version) {
    return res.status(400).json({ error: 'Missing params' });
  }

  const apiRes = await fetch(
    `https://api.github.com/repos/${REPO}/releases/latest`,
    {
      headers: {
        'User-Agent': 'aamodha-update-server/1.0',
        Accept: 'application/vnd.github.v3+json',
      },
    }
  );

  if (!apiRes.ok) return res.status(500).json({ error: 'GitHub API error' });

  const release = await apiRes.json();
  const latestVersion = (release.tag_name as string).replace(/^v/, '');

  // Client is already on the latest version
  if (latestVersion === version) return res.status(204).end();

  const assets: Array<{ name: string; browser_download_url: string }> = release.assets ?? [];

  let url: string | undefined;
  let sigUrl: string | undefined;

  if (target === 'windows-x86_64') {
    url    = assets.find(a => a.name.endsWith('.msi.zip'))?.browser_download_url;
    sigUrl = assets.find(a => a.name.endsWith('.msi.zip.sig'))?.browser_download_url;
  } else if (target.startsWith('darwin')) {
    url    = assets.find(a => a.name.endsWith('.app.tar.gz'))?.browser_download_url;
    sigUrl = assets.find(a => a.name.endsWith('.app.tar.gz.sig'))?.browser_download_url;
  }

  if (!url || !sigUrl) return res.status(204).end();

  const signature = await fetch(sigUrl).then(r => r.text());

  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
  return res.status(200).json({
    version: latestVersion,
    notes: release.body ?? '',
    pub_date: release.published_at,
    platforms: {
      [target]: { url, signature: signature.trim() },
    },
  });
}
