$base = 'http://localhost:3000'

function Attempt([string]$Email, [string]$Password, [string]$Pin, [string]$Mode) {
  $s = $null
  $c = (Invoke-RestMethod -Uri "$base/api/auth/csrf" -SessionVariable s).csrfToken
  $body = @{ csrfToken = $c; email = $Email; password = $Password; pin = $Pin; loginMode = $Mode; json = 'true' }
  Invoke-WebRequest -Uri "$base/api/auth/callback/credentials" -Method Post -Body $body -WebSession $s -UseBasicParsing | Out-Null
  $sess = Invoke-RestMethod -Uri "$base/api/auth/session" -WebSession $s
  if ($sess.user) { return 'LOGIN' } else { return 'GAGAL' }
}

# Email unik agar counter bersih: gunakan admin (belum dicoba test lain)
$em = 'admin@gugaramku.com'
for ($i = 1; $i -le 5; $i++) {
  $r = Attempt $em 'WRONG' '9999' 'pin'
  Write-Output "gagal $i : $r"
}
$r = Attempt $em 'admin123' '' 'password'
Write-Output "coba login benar setelah 5x gagal : $r (harus GAGAL = terkunci)"
