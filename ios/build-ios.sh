#!/usr/bin/env bash
set -e
echo "========================================================"
echo "  PAPABVTIFY iOS Release Packager (Xcode & IPA)"
echo "  Target: com.papabvtify.music"
echo "========================================================"

xcodebuild -workspace App.xcworkspace -scheme App -configuration Release -destination 'generic/platform=iOS' archive -archivePath build/PAPABVTIFY.xcarchive

if [ -f "exportOptions.plist" ]; then
    xcodebuild -exportArchive -archivePath build/PAPABVTIFY.xcarchive -exportPath build/IPA -exportOptionsPlist exportOptions.plist
    echo "========================================================"
    echo "IPA output siap: build/IPA/PAPABVTIFY.ipa"
    echo "========================================================"
else
    echo "XCArchive siap di: build/PAPABVTIFY.xcarchive"
fi
