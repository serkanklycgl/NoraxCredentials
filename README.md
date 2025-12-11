# Norax Credentials

Norax şirketine ait sunucu erişimleri, connection stringler ve üçüncü parti hesapların uçtan uca şifreli tutulduğu çözüm. Backend `.NET 9` ile MSSQL, frontend React + Vite + Tailwind üzerinde modern kırmızı tema ile gelir. Veriler veritabanında AES‑256 ile şifrelenir, ekranda çözümlenmiş şekilde gösterilir.

## Yapı
- `backend/NoraxCredentials.Api` – .NET 9 REST API, EF Core 8 + SQL Server, AES şifreleme, basit API key katmanı.
- `frontend/` – React 18 + Vite + Tailwind modern UI, kategori ve kayıt CRUD.
- `db/schema.sql` – MSSQL tablo ve seed scripti.

## Backend (API)
```bash
cd backend/NoraxCredentials.Api
# dotnet 9 SDK ile restore ve çalıştır
dotnet restore
dotnet run
```
Varsayılan URL: `https://localhost:7248` (`http://localhost:5248` de açık). Swagger: `/swagger`.

### Konfig
- `appsettings.json` içindeki connection string:  
  `Server=10.41.17.3\\ABKCORESQL;Initial Catalog=NoraxCredentials;Persist Security Info=True;User ID=sa;Password=SI&wrErItoVe;TrustServerCertificate=True;`
- `Encryption:Key` – AES anahtarı (32+ byte güçlü değer girin).
- `ApiKey` – `X-API-KEY` header değeri; boş bırakılırsa kontrol pasif olur.
- `Jwt` – `Key` (32+ byte), `Issuer`, `Audience`, `TokenLifetimeMinutes`.

API başlangıcında `EnsureCreated` çağrısı ile tablo yoksa oluşturur. Seed kategoriler: Sunucular, Veri Tabanları, İç Uygulamalar, Dış Uygulamalar.

### Uçlar (özet)
- Auth:  
  - `POST /api/auth/login` (JWT üretir)  
  - `POST /api/auth/register` (ilk kullanıcı serbest, sonrasında yetki ister)  
  - `GET /api/auth/me`
- `GET /api/categories` – kategorileri listele
- `POST /api/categories` – kategori oluştur
- `PUT /api/categories/{id}` – güncelle
- `DELETE /api/categories/{id}` – sil (ilişkili kayıtlarla birlikte)
- `GET /api/credentials?categoryId=...` – kayıt listele
- `POST /api/credentials` – kayıt oluştur (parola/connection string şifrelenir)
- `PUT /api/credentials/{id}` – güncelle
- `DELETE /api/credentials/{id}` – sil
- Kullanıcı Yönetimi (Admin):
  - `GET /api/users` – kullanıcıları listele
  - `POST /api/users` – kullanıcı oluştur
  - `PUT /api/users/{id}` – kullanıcı güncelle (parola boş bırakılırsa değişmez)
  - `DELETE /api/users/{id}` – sil
  - `PUT /api/users/{id}/access` – hangi credential kayıtlarına erişebileceğini ata

## Frontend
```bash
cd frontend
npm install
npm run dev    # http://localhost:5173
```
Çevre değişkenleri (`.env` veya `.env.local`):
```
VITE_API_BASE_URL=https://localhost:7248/api
VITE_API_KEY=norax-dev-key         # opsiyonel; backend ApiKey ile eşleşirse ek koruma
```

Arayüz artık login (JWT) ekranı, sol sidebar, topbar arama, kategori/kayıt CRUD, modal düzenleme ve kırmızı ağırlıklı neon/blur teması ile gelir. Login sonrası token otomatik olarak header’a eklenir.

## Veritabanı Scripti
`db/schema.sql` dosyasını `NoraxCredentials` veritabanında çalıştırarak tabloları, seed kategorileri ve admin kullanıcıyı (email: `admin@norax.com`, parola: `NoraxAdmin!2024`) oluşturabilirsiniz. EF Core da ilk açılışta şemayı yoksa üretir. Parolayı değiştirmek isterseniz scripti güncelleyin veya API üzerinden yeni kullanıcı oluşturun.
