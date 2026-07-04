
Set-Location "C:\Users\levol\Downloads\your-portfolio\brands"

$brandNavCSS = @'

        /* --- Brand Nav Bar (bottom of every subpage) --- */
        .brand-nav-bar {
            background: rgba(8, 10, 20, 0.97);
            backdrop-filter: blur(24px);
            border-top: 1px solid rgba(255,255,255,0.06);
            padding: 40px 5% 52px;
        }
        .brand-nav-inner {
            max-width: 1100px;
            margin: 0 auto;
        }
        .brand-nav-label {
            text-align: center;
            font-size: 0.68rem;
            font-weight: 700;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: rgba(255,255,255,0.25);
            margin-bottom: 28px;
        }
        .brand-nav-grid {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            align-items: center;
            gap: 12px;
        }
        .brand-nav-btn {
            display: inline-flex;
            align-items: center;
            gap: 9px;
            padding: 9px 18px 9px 10px;
            border-radius: 100px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.04);
            color: rgba(255,255,255,0.7);
            font-size: 0.8rem;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.25s cubic-bezier(0.16,1,0.3,1);
            white-space: nowrap;
        }
        .brand-nav-btn:hover {
            border-color: rgba(92,88,237,0.5);
            background: rgba(92,88,237,0.1);
            color: #fff;
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(92,88,237,0.2);
        }
        .brand-nav-btn.active-brand {
            border-color: rgba(92,88,237,0.45);
            background: rgba(92,88,237,0.14);
            color: #B3B0FF;
            pointer-events: none;
        }
        .brand-nav-btn .bnb-logo {
            width: 26px;
            height: 26px;
            border-radius: 50%;
            object-fit: cover;
            flex-shrink: 0;
            border: 1px solid rgba(255,255,255,0.1);
        }
        .brand-nav-btn.dc-home {
            padding: 9px 22px;
            background: rgba(92,88,237,0.15);
            border-color: rgba(92,88,237,0.35);
            color: #B3B0FF;
            font-weight: 800;
            font-size: 0.92rem;
            letter-spacing: 0.06em;
        }
        .brand-nav-btn.dc-home:hover {
            background: rgba(92,88,237,0.28);
            border-color: rgba(92,88,237,0.7);
            color: #fff;
            box-shadow: 0 8px 32px rgba(92,88,237,0.35);
        }
        @media (max-width: 640px) {
            .brand-nav-grid { gap: 8px; }
            .brand-nav-btn { font-size: 0.72rem; padding: 7px 14px 7px 8px; gap: 7px; }
            .brand-nav-btn .bnb-logo { width: 22px; height: 22px; }
        }
'@

$brandNavHTML = @'

    <!-- Brand Navigation Bar -->
    <nav class="brand-nav-bar">
        <div class="brand-nav-inner">
            <div class="brand-nav-label">Explore All Brands</div>
            <div class="brand-nav-grid">
                <a href="../divyaraj_chauhan_portfolio.html#portfolio" class="brand-nav-btn dc-home">DC.</a>
                <a href="credes.html" class="brand-nav-btn MARK_CREDES"><img class="bnb-logo" src="../images/Logos of the brands/credes techlabs.jpg" alt="">Credes</a>
                <a href="gujarat-tigers.html" class="brand-nav-btn MARK_GT"><img class="bnb-logo" src="../images/Logos of the brands/Gujarat Tigers.png" alt="">Gujarat Tigers</a>
                <a href="sattvik.html" class="brand-nav-btn MARK_SATTVIK"><img class="bnb-logo" src="../images/Logos of the brands/Sattvik Certifications.jpg" alt="">Sattvik</a>
                <a href="esfi.html" class="brand-nav-btn MARK_ESFI"><img class="bnb-logo" src="../images/Logos of the brands/esfi.jpg" alt="">ESFI</a>
                <a href="white-horse.html" class="brand-nav-btn MARK_WH"><img class="bnb-logo" src="../images/Logos of the brands/white horse.jpg" alt="">White Horse</a>
                <a href="finanvo.html" class="brand-nav-btn MARK_FIN"><img class="bnb-logo" src="../images/Logos of the brands/finanvo.png" alt="">Finanvo</a>
                <a href="scuff.html" class="brand-nav-btn MARK_SCUFF"><img class="bnb-logo" src="../images/Logos of the brands/scuff.jpeg" alt="">Scuff</a>
                <a href="highrocks.html" class="brand-nav-btn MARK_HR"><img class="bnb-logo" src="../images/Logos of the brands/highrocks.jpg" alt="">HighRocks</a>
                <a href="shelf.html" class="brand-nav-btn MARK_SHELF"><img class="bnb-logo" src="../images/Logos of the brands/shelf.png" alt="">Shelf</a>
                <a href="shift.html" class="brand-nav-btn MARK_SHIFT"><img class="bnb-logo" src="../images/Logos of the brands/shift.jpg" alt="">Shift</a>
                <a href="giffy.html" class="brand-nav-btn MARK_GIFFY"><img class="bnb-logo" src="../images/Logos of the brands/giffy.jpg" alt="">Giffy</a>
                <a href="hashlite.html" class="brand-nav-btn MARK_HL"><img class="bnb-logo" src="../images/Logos of the brands/hashlite.png" alt="">Hashlite</a>
            </div>
        </div>
    </nav>
'@

# [file, active-mark, eyebrow-replacement-text]
$brands = @(
    @("credes.html",        "MARK_CREDES",  ""),
    @("esfi.html",          "MARK_ESFI",    "Jul 2024 - Sep 2024  Operations Volunteer"),
    @("finanvo.html",       "MARK_FIN",     "2024 - 2025  B2B Social Media"),
    @("giffy.html",         "MARK_GIFFY",   "2024 - Present  Social Media Manager"),
    @("gujarat-tigers.html","MARK_GT",      "2024 - 2025  Esports SMM"),
    @("hashlite.html",      "MARK_HL",      "2024 - Present  SMM"),
    @("highrocks.html",     "MARK_HR",      "2025 - Present  Product & Brand"),
    @("sattvik.html",       "MARK_SATTVIK", "Jan 2026  Event Digital Campaign"),
    @("scuff.html",         "MARK_SCUFF",   "2025 - Present  Social Media Manager"),
    @("shelf.html",         "MARK_SHELF",   "2024 - 2025  SMM"),
    @("shift.html",         "MARK_SHIFT",   "2024 - 2025  Fitness App SMM"),
    @("white-horse.html",   "MARK_WH",      "2024 - 2025  Healthcare SMM")
)

$allMarks = @("MARK_CREDES","MARK_GT","MARK_SATTVIK","MARK_ESFI","MARK_WH","MARK_FIN","MARK_SCUFF","MARK_HR","MARK_SHELF","MARK_SHIFT","MARK_GIFFY","MARK_HL")

foreach ($brand in $brands) {
    $file    = $brand[0]
    $myMark  = $brand[1]
    $eyebrow = $brand[2]

    if (-not (Test-Path $file)) { Write-Host "SKIP: $file"; continue }

    $content = [System.IO.File]::ReadAllText((Resolve-Path $file), [System.Text.Encoding]::UTF8)

    # 1. Inject CSS before first </style>
    if ($content -notmatch 'brand-nav-bar') {
        $content = $content -replace '</style>', ($brandNavCSS + "`n        </style>")
    }

    # 2. Fix Back to Portfolio link (ensure it has #portfolio)
    $content = $content -replace 'href="\.\./divyaraj_chauhan_portfolio\.html"(\s+class="back-btn")', 'href="../divyaraj_chauhan_portfolio.html#portfolio"$1'
    $content = $content -replace 'class="back-btn"(\s+)href="\.\./divyaraj_chauhan_portfolio\.html"', 'class="back-btn"$1href="../divyaraj_chauhan_portfolio.html#portfolio"'

    # 3. Fix eyebrow text
    if ($eyebrow -ne "") {
        $content = $content -replace 'Divyaraj Chauhan\s*[xX\xD7A\-]+\s*Case Study', $eyebrow
        $content = $content -replace 'Divyaraj Chauhan A- Case Study', $eyebrow
        $content = $content -replace 'Divyaraj Chauhan x Case Study', $eyebrow
        $content = $content -replace 'Divyaraj Chauhan X Case Study', $eyebrow
    }

    # 4. Build per-brand nav (replace current brand mark with active-brand, strip rest)
    $navForBrand = $brandNavHTML -replace $myMark, 'active-brand'
    foreach ($m in $allMarks) {
        if ($m -ne $myMark) {
            $navForBrand = $navForBrand -replace (" " + $m), ""
        }
    }

    # 5. Inject nav before </main>
    if ($content -notmatch 'brand-nav-bar') {
        $content = $content -replace '</main>', ($navForBrand + "</main>")
    }

    [System.IO.File]::WriteAllText((Resolve-Path $file), $content, [System.Text.Encoding]::UTF8)
    Write-Host "DONE: $file"
}

Write-Host "`nAll brand pages updated!"
