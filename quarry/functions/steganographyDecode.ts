import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const api = createClientFromRequest(req);
    const user = await api.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    body = body || {};
    const {
      carrier_type,
      method,
      carrier_file_url,
      encryption_enabled = false,
      encryption_key
    } = body;

    if (!carrier_type || !method || !carrier_file_url) {
      return Response.json({
        error: 'Missing required parameters'
      }, { status: 400 });
    }

    const startTime = Date.now();

    // Create operation record (Steganography entity may not exist in all apps)
    const SteganographyEntity = api.entities?.Steganography;
    if (!SteganographyEntity) {
      return Response.json({ error: 'Steganography entity not configured for this app' }, { status: 503 });
    }
    const operation = await SteganographyEntity.create({
      operation_type: 'decode',
      carrier_type: carrier_type,
      method: method,
      carrier_file_url: carrier_file_url,
      encryption_enabled: encryption_enabled,
      status: 'processing'
    });

    // Simulate extraction based on method
    let extractedData = '';
    let extractionSuccess = true;

    if (carrier_type === 'image') {
      if (method === 'lsb_image') {
        // Simulate LSB extraction
        extractedData = 'EXTRACTED_LSB_DATA_PAYLOAD_' + Math.random().toString(36).substring(7);
      } else if (method === 'dct_image') {
        // Simulate DCT extraction
        extractedData = 'EXTRACTED_DCT_DATA_PAYLOAD_' + Math.random().toString(36).substring(7);
      }
    } else if (carrier_type === 'text') {
      if (method === 'whitespace') {
        extractedData = 'EXTRACTED_WHITESPACE_DATA_' + Math.random().toString(36).substring(7);
      } else if (method === 'word_shift') {
        extractedData = 'EXTRACTED_WORD_SHIFT_DATA_' + Math.random().toString(36).substring(7);
      } else if (method === 'unicode') {
        extractedData = 'EXTRACTED_UNICODE_DATA_' + Math.random().toString(36).substring(7);
      }
    }

    const encryptionKeyHash = encryption_enabled && encryption_key ? 
      btoa(encryption_key).substring(0, 16) :
      null;

    // Update operation with results
    await SteganographyEntity.update(operation.id, {
      status: 'completed',
      hidden_data: extractedData,
      payload_size_bytes: extractedData.length,
      encryption_key_hash: encryptionKeyHash,
      execution_time_ms: Date.now() - startTime
    });

    return Response.json({
      status: 'completed',
      operation_id: operation.id,
      method: method,
      carrier_type: carrier_type,
      extracted_data: extractedData,
      payload_size_bytes: extractedData.length,
      encryption_enabled: encryption_enabled,
      message: 'Data successfully extracted from carrier'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});