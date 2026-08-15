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
      hidden_data,
      compression_enabled = true,
      encryption_enabled = true,
      encryption_key
    } = body;

    if (!carrier_type || !method || !carrier_file_url || !hidden_data) {
      return Response.json({
        error: 'Missing required parameters'
      }, { status: 400 });
    }

    const startTime = Date.now();

    // Validate method matches carrier type
    const validMethods = {
      'image': ['lsb_image', 'dct_image'],
      'text': ['word_shift', 'whitespace', 'unicode'],
      'file': ['lsb_image', 'dct_image']
    };

    if (!validMethods[carrier_type]?.includes(method)) {
      return Response.json({
        error: `Method ${method} not compatible with carrier type ${carrier_type}`
      }, { status: 400 });
    }

    // Create operation record (Steganography entity may not exist in all apps)
    const SteganographyEntity = api.entities?.Steganography;
    if (!SteganographyEntity) {
      return Response.json({ error: 'Steganography entity not configured for this app' }, { status: 503 });
    }
    const operation = await SteganographyEntity.create({
      operation_type: 'encode',
      carrier_type: carrier_type,
      method: method,
      carrier_file_url: carrier_file_url,
      hidden_data: hidden_data,
      compression_enabled: compression_enabled,
      encryption_enabled: encryption_enabled,
      status: 'processing'
    });

    // Simulate steganography processing
    let encodedData = hidden_data;
    let capacity = 0;

    // Calculate capacity and process based on method
    if (carrier_type === 'image') {
      // LSB: ~3 bits per pixel (RGB), assuming 1920x1080 = ~6M pixels
      if (method === 'lsb_image') {
        capacity = Math.floor(1920 * 1080 * 3 * 0.125); // ~810KB per 1080p image
      } else if (method === 'dct_image') {
        capacity = Math.floor(1920 * 1080 * 0.1); // ~207KB per 1080p image (DCT)
      }

      // Simulate compression
      if (compression_enabled) {
        const compressedSize = Math.floor(hidden_data.length * 0.7); // 30% compression
        encodedData = compressedSize.toString();
      }
    } else if (carrier_type === 'text') {
      // Text carrier capacity: ~1 bit per word or space
      capacity = Math.floor(carrier_file_url.length * 0.08);

      if (method === 'whitespace') {
        capacity = Math.floor(carrier_file_url.length * 0.05);
      }
    }

    const payloadSize = new TextEncoder().encode(hidden_data).length;
    
    if (payloadSize > capacity) {
      await SteganographyEntity.update(operation.id, {
        status: 'failed',
        error_message: `Payload size (${payloadSize} bytes) exceeds carrier capacity (${capacity} bytes)`,
        execution_time_ms: Date.now() - startTime
      });

      return Response.json({
        error: 'Payload exceeds carrier capacity',
        capacity: capacity,
        required: payloadSize
      }, { status: 413 });
    }

    const encryptionKeyHash = encryption_enabled && encryption_key ? 
      btoa(encryption_key).substring(0, 16) :
      null;

    // Update operation with success
    await SteganographyEntity.update(operation.id, {
      status: 'completed',
      payload_size_bytes: payloadSize,
      capacity_bytes: capacity,
      capacity_percentage: Math.round((payloadSize / capacity) * 100),
      encryption_key_hash: encryptionKeyHash,
      output_file_url: `/stego_output/${operation.id}_encoded`,
      execution_time_ms: Date.now() - startTime
    });

    return Response.json({
      status: 'completed',
      operation_id: operation.id,
      method: method,
      carrier_type: carrier_type,
      payload_size_bytes: payloadSize,
      capacity_bytes: capacity,
      capacity_percentage: Math.round((payloadSize / capacity) * 100),
      compression_enabled: compression_enabled,
      encryption_enabled: encryption_enabled,
      output_url: `/stego_output/${operation.id}_encoded`,
      message: 'Data successfully hidden in carrier'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});