# Recovery Mechanism untuk Payment Status Pending

## Masalah
Jika Midtrans sedang maintenance saat user membayar:
- Order berhasil dibuat dengan status `pending`
- PDF tiket tetap menampilkan "UNPAID"
- Saat Midtrans kembali normal, order tidak ter-update otomatis

## Solusi

### 1. **Automatic Recovery di Download/View** ✅
Saat user akses endpoint download atau preview PDF:
```
GET /api/ticket/download/{order_id}
GET /api/ticket/view/{order_id}
```

Sistem akan:
- Cek apakah status masih `pending`
- Jika pending → query status terbaru ke Midtrans
- Jika berubah ke `settlement` → update database + kirim email tiket
- Generate PDF dengan status terbaru

### 2. **Manual Recovery Endpoint**
Untuk batch sync pending orders atau debug:

```bash
# Sync SEMUA orders dengan status pending
curl -X GET "https://your-domain.com/api/sxjxfx6x6x6x/sync-payment-status" \
  -H "Authorization: Bearer your-sync-api-key"

# Sync 1 order spesifik
curl -X GET "https://your-domain.com/api/sxjxfx6x6x6x/sync-payment-status?order_id=SJF2-1234567890" \
  -H "Authorization: Bearer your-sync-api-key"

# Sync dengan filter status tertentu
curl -X GET "https://your-domain.com/api/sxjxfx6x6x6x/sync-payment-status?status=pending" \
  -H "Authorization: Bearer your-sync-api-key"
```

### 3. **Setup Environment Variable**
Di `.env.local`:
```
SYNC_API_KEY=your-strong-secret-key
```

### 4. **Response Format**
```json
{
  "totalProcessed": 5,
  "totalChanged": 2,
  "results": [
    {
      "order_id": "SJF2-1234567890",
      "nama": "John Doe",
      "oldStatus": "pending",
      "newStatus": "settlement",
      "changed": true,
      "message": "Status berubah dari pending ke settlement"
    }
  ]
}
```

## Flow Lengkap

### Skenario: User beli tiket saat Midtrans maintenance
1. User checkout → Order.create() dengan status `pending` ✅
2. Midtrans sedang maintenance → Webhook mungkin ter-delay
3. User coba download tiket → Sistem auto check ke Midtrans → Status update ke `settlement` + Email dikirim ✅
4. PDF di-generate dengan status "settlement" ✅

### Skenario: Admin perlu manual recovery
```bash
# Cek semua pending orders
curl -X GET "https://your-domain.com/api/sxjxfx6x6x6x/sync-payment-status?status=pending" \
  -H "Authorization: Bearer $SYNC_API_KEY"

# Jika ada yang berubah, akan trigger sendTicketEmail otomatis
```

## Testing

### 1. Test dengan Midtrans Sandbox
```bash
# Simulate pending payment
curl -X POST "https://your-domain.com/api/checkout" \
  -H "Content-Type: application/json" \
  -d '{
    "nama": "Test User",
    "email": "test@example.com",
    "no_hp": "08123456789",
    "jenis_kelamin": "Laki-laki",
    "sosmed_type": "instagram",
    "sosmed_username": "testuser",
    "asal_kota": "Solo",
    "kategori_usia": "20-25"
  }'

# Dapatkan order_id, jangan selesaikan pembayaran

# Cek status PDF preview (masih pending)
curl -X GET "https://your-domain.com/api/ticket/view/{order_id}" -o tiket-pending.pdf

# Selesaikan pembayaran di Midtrans Sandbox

# Cek status PDF download (harus update otomatis ke settlement)
curl -X GET "https://your-domain.com/api/ticket/download/{order_id}" -o tiket-settlement.pdf

# Manual recovery
curl -X GET "https://your-domain.com/api/sxjxfx6x6x6x/sync-payment-status?order_id={order_id}" \
  -H "Authorization: Bearer $SYNC_API_KEY"
```

## Keamanan
- Endpoint `/api/sxjxfx6x6x6x/sync-payment-status` dilindungi `SYNC_API_KEY`
- Hapus/ubah SYNC_API_KEY di environment untuk production
- Pertimbangkan menambahkan rate limiting jika di-expose untuk scheduled tasks
