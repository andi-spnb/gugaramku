# E2E test GuGaramKu v3
$base = 'http://localhost:3000'

function New-Session {
  param([string]$Email, [string]$Secret, [string]$Mode)
  $s = $null
  $csrf = (Invoke-RestMethod -Uri "$base/api/auth/csrf" -SessionVariable s).csrfToken
  $body = @{ csrfToken = $csrf; email = $Email; password = $Secret; pin = $Secret; loginMode = $Mode; json = 'true' }
  Invoke-WebRequest -Uri "$base/api/auth/callback/credentials" -Method Post -Body $body -WebSession $s -UseBasicParsing | Out-Null
  return $s
}
function Get-Session {
  param($Session)
  try { return (Invoke-RestMethod -Uri "$base/api/auth/session" -WebSession $Session) } catch { return $null }
}
function Get-Json {
  param($Session, [string]$Path)
  try { return Invoke-RestMethod -Uri "$base$Path" -WebSession $Session }
  catch { return @{ _status = [int]$_.Exception.Response.StatusCode } }
}
function Post-Json {
  param($Session, [string]$Path, $Body)
  try { return Invoke-RestMethod -Uri "$base$Path" -Method Post -WebSession $Session -ContentType 'application/json' -Body ($Body | ConvertTo-Json -Depth 10) }
  catch {
    try {
      $stream = $_.Exception.Response.GetResponseStream()
      $reader = New-Object System.IO.StreamReader($stream)
      return ($reader.ReadToEnd() | ConvertFrom-Json)
    } catch { return @{ _status = 0 } }
  }
}

$script:Pass = 0; $script:Fail = 0
function Check {
  param([string]$Nama, [bool]$Kondisi, [string]$Detail = '')
  if ($Kondisi) { $script:Pass++; Write-Output "PASS: $Nama" }
  else { $script:Fail++; Write-Output "FAIL: $Nama $Detail" }
}

$kasir = New-Session 'kasir@gugaramku.com' 'kasir123' 'password'

$produk = Get-Json $kasir '/api/products'
$p = $produk.data | Where-Object { $_.produkSatuan.Count -gt 0 -and $_.stok.Count -gt 0 -and $_.stok[0].cabangId -eq 'demo-cabang-001' } | Select-Object -First 1
$sat = $p.produkSatuan[0]
$stokAwal = [double]$p.stok[0].jumlah
Write-Output ("Produk uji: $($p.nama), stok: $stokAwal, harga1: $($sat.harga1)")

function New-Item {
  param([string]$SatuanId, [string]$Nama, [int]$Jumlah, [double]$Harga, [double]$Diskon = 0)
  return @{ produkSatuanId = $SatuanId; namaBarang = $Nama; jumlah = $Jumlah; satuan = 'sak'; konversi = 1; hargaJual = $Harga; hargaModal = 500; diskon = $Diskon; isQuickSale = $false }
}

# ---- T4: stok berlebih ditolak (bayar cukup) ----
$qty = 99999999
$r = Post-Json $kasir '/api/transactions' @{
  tingkatHarga = 1; metodeBayar = 'TUNAI'; jumlahBayar = ($qty * $sat.harga1); diskonTotal = 0
  items = @(New-Item $sat.id $p.nama $qty $sat.harga1)
}
Check 'T4 Stok berlebih ditolak STOCK_INSUFFICIENT' ($r.success -eq $false -and $r.error.code -eq 'STOCK_INSUFFICIENT') (ConvertTo-Json $r -Depth 3)

# ---- T11: buat pelanggan, transaksi HUTANG, bayar hutang -> kas masuk ----
$customers = Get-Json $kasir '/api/customers'
if ($customers.data.Count -eq 0) {
  $r = Post-Json $kasir '/api/customers' @{ nama = 'E2E Test Customer'; telepon = '081234567890'; kategori = 'UMUM'; maxHutang = 1000000 }
  Check 'T11a Buat pelanggan sukses' ($r.success -eq $true) (ConvertTo-Json $r -Depth 3)
}
$customers = Get-Json $kasir '/api/customers'
$cust = $customers.data | Select-Object -First 1
Check 'T11b Ada pelanggan' ($null -ne $cust)

$admin = New-Session 'admin@gugaramku.com' 'admin123' 'password'
$kasBefore = Get-Json $admin '/api/kas'
$saldoSebelum = [double]$kasBefore.data.saldo

$r = Post-Json $kasir '/api/transactions' @{
  tingkatHarga = 1; metodeBayar = 'HUTANG'; jumlahBayar = 0; diskonTotal = 0; pelangganId = $cust.id
  items = @(New-Item $sat.id $p.nama 1 $sat.harga1)
}
Check 'T11c Transaksi HUTANG sukses' ($r.success -eq $true) (ConvertTo-Json $r -Depth 3)

if ($r.success) {
  $debts = Get-Json $kasir "/api/debts"
  $hutangBaru = $debts.data | Where-Object { $_.transaksiId -eq $r.data.id } | Select-Object -First 1
  Check 'T11d Hutang terlihat di daftar' ($null -ne $hutangBaru)

  if ($hutangBaru) {
    $rPay = Post-Json $kasir "/api/debts/$($hutangBaru.id)/pay" @{ jumlah = $hutangBaru.sisa; metode = 'TUNAI'; catatan = 'E2E pay' }
    Check 'T11e Bayar hutang sukses' ($rPay.success -eq $true) (ConvertTo-Json $rPay -Depth 3)
    $kasAfter = Get-Json $admin '/api/kas'
    Check 'T11f Saldo kas bertambah' ([double]$kasAfter.data.saldo -eq ($saldoSebelum + [double]$hutangBaru.sisa)) ("$saldoSebelum -> $($kasAfter.data.saldo)")
  }

  # ---- T12: overpayment ditolak ----
  $r2 = Post-Json $kasir '/api/transactions' @{
    tingkatHarga = 1; metodeBayar = 'HUTANG'; jumlahBayar = 0; diskonTotal = 0; pelangganId = $cust.id
    items = @(New-Item $sat.id $p.nama 1 $sat.harga1)
  }
  if ($r2.success) {
    $debts2 = Get-Json $kasir "/api/debts"
    $hutang2 = $debts2.data | Where-Object { $_.transaksiId -eq $r2.data.id } | Select-Object -First 1
    $rPay2 = Post-Json $kasir "/api/debts/$($hutang2.id)/pay" @{ jumlah = ([double]$hutang2.sisa + 1000000); metode = 'TUNAI' }
    Check 'T12 Overpayment ditolak' ($rPay2.success -eq $false) (ConvertTo-Json $rPay2 -Depth 3)
    Post-Json $kasir "/api/debts/$($hutang2.id)/pay" @{ jumlah = $hutang2.sisa; metode = 'TUNAI' } | Out-Null
  }
}

# ---- T14: rate limiting (paling akhir, mengunci email kasir) ----
for ($i = 1; $i -le 5; $i++) {
  $s = $null
  $csrf = (Invoke-RestMethod -Uri "$base/api/auth/csrf" -SessionVariable s).csrfToken
  $body = @{ csrfToken = $csrf; email = 'kasir@gugaramku.com'; password = 'WRONG'; pin = '9999'; loginMode = 'pin'; json = 'true' }
  Invoke-WebRequest -Uri "$base/api/auth/callback/credentials" -Method Post -Body $body -WebSession $s -UseBasicParsing | Out-Null
}
# Coba login benar -> harus gagal (lockout)
$s = $null
$csrf = (Invoke-RestMethod -Uri "$base/api/auth/csrf" -SessionVariable s).csrfToken
$body = @{ csrfToken = $csrf; email = 'kasir@gugaramku.com'; password = 'kasir123'; loginMode = 'password'; json = 'true' }
Invoke-WebRequest -Uri "$base/api/auth/callback/credentials" -Method Post -Body $body -WebSession $s -UseBasicParsing | Out-Null
$sess = Get-Session $s
Check 'T14 Lockout: login benar ditolak setelah 5x gagal' ($null -eq $sess.user)

# Login user lain masih bisa (lockout per email, bukan global)
$owner = New-Session 'owner@gugaramku.com' 'owner123' 'password'
$sessOwner = Get-Session $owner
Check 'T14b Lockout hanya per email (owner masih bisa)' ($sessOwner.user.role -eq 'OWNER')

Write-Output ''
Write-Output "===== HASIL: $script:Pass PASS, $script:Fail FAIL ====="
