Add-Type -AssemblyName System.Drawing

$images = @(
    'Views.jpg',
    'Mr. Morale.jpg',
    'Without-Warning.jpg',
    'My Beautiful Dark Twisted Fantasy.jpg'
)

$variants = @(
    @{ suffix = 'desktop'; width = 1600 },
    @{ suffix = 'mobile';  width = 900 }
)

foreach ($name in $images) {
    $srcPath = Join-Path 'img' $name
    if (-not (Test-Path $srcPath)) {
        Write-Warning \"missing $srcPath\"
        continue
    }

    $original = [System.Drawing.Image]::FromFile($srcPath)

    foreach ($variant in $variants) {
        $targetWidth = $variant.width
        $suffix = $variant.suffix

        if ($original.Width -le $targetWidth) {
            $resized = New-Object System.Drawing.Bitmap $original
        } else {
            $scale = $targetWidth / $original.Width
            $targetHeight = [int]($original.Height * $scale)
            $resized = New-Object System.Drawing.Bitmap ($targetWidth, $targetHeight)
            $graphics = [System.Drawing.Graphics]::FromImage($resized)
            $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $graphics.DrawImage($original, 0, 0, $targetWidth, $targetHeight)
            $graphics.Dispose()
        }

        $outName = ($name -replace ' ', '-') -replace '\.jpg$',''
        $destPath = Join-Path 'img' ($outName + '-' + $suffix + '.jpg')

        $resized.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
        $resized.Dispose()
        Write-Host \"created $destPath\"
    }

    $original.Dispose()
}
