import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { fileName, folderId, folderPath, fileData, mimeType } = await req.json();

    if (!fileName || !fileData) {
      throw new Error('fileName and fileData are required');
    }

    // Get access token (call the token refresh function)
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL not configured');
    }

    const tokenResponse = await fetch(
      `${supabaseUrl}/functions/v1/google-drive-token`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY') || ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }
    );

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Failed to get access token: ${error.error || tokenResponse.statusText}`);
    }

    const { accessToken } = await tokenResponse.json();

    // Resolve folderPath to folderId if folderPath is provided
    let resolvedFolderId = folderId;
    if (folderPath && !folderId) {
      resolvedFolderId = await resolveFolderPath(folderPath, accessToken);
    }

    // Convert base64 to Uint8Array
    const fileBuffer = Uint8Array.from(atob(fileData), c => c.charCodeAt(0));

    // Create multipart body for Google Drive API
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const metadata = {
      name: fileName,
      ...(resolvedFolderId && { parents: [resolvedFolderId] }),
    };

    const encoder = new TextEncoder();
    const metadataPart = encoder.encode(
      `--${boundary}\r\n` +
      `Content-Type: application/json\r\n\r\n` +
      `${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: ${mimeType || 'application/octet-stream'}\r\n\r\n`
    );
    const endBoundary = encoder.encode(`\r\n--${boundary}--\r\n`);

    const body = new Uint8Array(metadataPart.length + fileBuffer.length + endBoundary.length);
    body.set(metadataPart, 0);
    body.set(fileBuffer, metadataPart.length);
    body.set(endBoundary, metadataPart.length + fileBuffer.length);

    // Upload to Google Drive
    const uploadResponse = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: body,
      }
    );

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Upload error:', error);
      throw new Error(`Upload failed: ${JSON.stringify(error)}`);
    }

    const uploadData = await uploadResponse.json();

    // Get file URLs
    const fileId = uploadData.id;
    const webViewLink = `https://drive.google.com/file/d/${fileId}/view`;
    const webContentLink = `https://drive.google.com/uc?export=download&id=${fileId}`;

    return new Response(
      JSON.stringify({
        id: fileId,
        webViewLink,
        webContentLink,
        name: uploadData.name,
        fileId: fileId,
        fileUrl: webViewLink,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in google-drive-upload function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Resolve folder path to folder ID
 * Creates folder hierarchy if it doesn't exist
 * Returns folder ID or null to upload to root
 */
async function resolveFolderPath(folderPath: string, accessToken: string): Promise<string | null> {
  try {
    // Parse folder path (e.g., "MyDrive/DatabaseBackups" or "DatabaseBackups")
    // Remove "MyDrive/" prefix if present (it's just a display name, not a real folder)
    let normalizedPath = folderPath.replace(/^MyDrive\//i, '').trim();
    
    const parts = normalizedPath.split('/').filter(Boolean);
    
    // If no path specified, return null (upload to root)
    if (parts.length === 0) {
      return null;
    }

    let parentId: string = 'root'; // Start at root

    for (const folderName of parts) {
      // Check if folder exists
      const existingFolder = await findFolder(folderName, parentId, accessToken);
      
      if (existingFolder) {
        parentId = existingFolder.id;
      } else {
        // Create folder
        const newFolder = await createFolderInDrive(folderName, parentId, accessToken);
        parentId = newFolder.id;
      }
    }

    return parentId;
  } catch (error) {
    console.error('Error resolving folder path:', error);
    // If folder creation fails, return null to upload to root as fallback
    console.warn('Folder path resolution failed, uploading to root instead');
    return null;
  }
}

/**
 * Find folder by name and parent
 */
async function findFolder(
  folderName: string,
  parentId: string,
  accessToken: string
): Promise<{ id: string } | null> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?` +
      `q=name='${encodeURIComponent(folderName)}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.files && data.files.length > 0 ? { id: data.files[0].id } : null;
  } catch (error) {
    console.error('Error finding Google Drive folder:', error);
    return null;
  }
}

/**
 * Create folder in Google Drive
 */
async function createFolderInDrive(
  folderName: string,
  parentId: string,
  accessToken: string
): Promise<{ id: string }> {
  const response = await fetch(
    'https://www.googleapis.com/drive/v3/files',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`Failed to create folder: ${JSON.stringify(error)}`);
  }

  return await response.json();
}
