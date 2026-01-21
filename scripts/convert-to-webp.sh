#!/bin/bash

# Script untuk convert semua PNG/JPG ke WebP
# Gunakan: bash scripts/convert-to-webp.sh

# Require cwebp (install dengan: apt-get install webp atau brew install webp)

if ! command -v cwebp &> /dev/null; then
    echo "❌ cwebp tidak ditemukan. Install dengan:"
    echo "   macOS: brew install webp"
    echo "   Linux: sudo apt-get install webp"
    echo "   Windows: Download dari https://developers.google.com/speed/webp/download"
    exit 1
fi

CONVERTED=0
SKIPPED=0

echo "🔄 Converting images to WebP format..."
echo ""

# Convert PNG files
for file in $(find public -type f -name "*.png"); do
    webp_file="${file%.png}.webp"
    
    if [ ! -f "$webp_file" ]; then
        echo "📝 Converting: $file"
        cwebp -q 85 "$file" -o "$webp_file"
        echo "   ✅ Created: $webp_file"
        ((CONVERTED++))
    else
        echo "⏭️  Skipped: $webp_file (already exists)"
        ((SKIPPED++))
    fi
done

# Convert JPG files
for file in $(find public -type f \( -name "*.jpg" -o -name "*.jpeg" \)); do
    webp_file="${file%.*}.webp"
    
    if [ ! -f "$webp_file" ]; then
        echo "📝 Converting: $file"
        cwebp -q 85 "$file" -o "$webp_file"
        echo "   ✅ Created: $webp_file"
        ((CONVERTED++))
    else
        echo "⏭️  Skipped: $webp_file (already exists)"
        ((SKIPPED++))
    fi
done

echo ""
echo "✨ Conversion complete!"
echo "   📊 Converted: $CONVERTED files"
echo "   ⏭️  Skipped: $SKIPPED files"
echo ""
echo "💡 Tip: Update your img src attributes to use .webp files"
echo "   Or use the PictureImage component for automatic fallback"
