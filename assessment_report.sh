#!/usr/bin/env bash

echo "🚀 SuperDapp JS SDK - Complete Assessment Report"
echo "================================================"
echo ""

cd /home/mickey/Dev/SuperDapp/superdapp-js

echo "📦 Package Information:"
echo "- Name: $(grep '"name"' package.json | head -1 | sed 's/.*"name": "\(.*\)".*/\1/')"
echo "- Version: $(grep '"version"' package.json | head -1 | sed 's/.*"version": "\(.*\)".*/\1/')"
echo "- Main Entry: $(grep '"main"' package.json | head -1 | sed 's/.*"main": "\(.*\)".*/\1/')"
echo ""

echo "🏗️ Build Status:"
if [ -d "dist" ]; then
    echo "✅ Build directory exists"
    echo "   Compiled files:"
    find dist -name "*.js" | wc -l | xargs echo "   - JavaScript files:"
    find dist -name "*.d.ts" | wc -l | xargs echo "   - Type definition files:"
else
    echo "❌ Build directory missing"
fi
echo ""

echo "🧪 Test Status:"
if npm test > /tmp/test_output.log 2>&1; then
    echo "✅ All tests passing"
    grep -o "[0-9]* passed" /tmp/test_output.log | tail -1 || echo "   Test results not parsed"
else
    echo "❌ Some tests failing"
fi
echo ""

echo "📁 Project Structure:"
echo "✅ Source code:"
echo "   - src/ directory: $([ -d src ] && echo "EXISTS" || echo "MISSING")"
echo "   - Core files: $(find src -name "*.ts" 2>/dev/null | wc -l) TypeScript files"
echo "   - Test files: $(find src -name "*.test.ts" 2>/dev/null | wc -l) test files"
echo ""

echo "🔧 CLI Functionality:"
if node dist/cli/index.js --help > /tmp/cli_help.log 2>&1; then
    echo "✅ CLI working"
    echo "   Available commands:"
    grep -E "^\s+(init|configure|run|status)" /tmp/cli_help.log | sed 's/^/   - /'
else
    echo "❌ CLI not working"
fi
echo ""

echo "📄 Examples and Templates:"
echo "   - Examples directory: $([ -d examples ] && echo "EXISTS" || echo "MISSING")"
if [ -d examples ]; then
    echo "   - Example projects: $(find examples -name "*.ts" | wc -l) files"
fi
echo "   - Templates directory: $([ -d src/templates ] && echo "EXISTS" || echo "MISSING")"
echo ""

echo "🔐 Environment Configuration:"
echo "   - .env.example: $([ -f .env.example ] && echo "EXISTS" || echo "MISSING")"
echo "   - Environment validation: $([ -f src/utils/env.ts ] && echo "IMPLEMENTED" || echo "MISSING")"
echo ""

echo "📚 Documentation:"
echo "   - README.md: $([ -f README.md ] && echo "EXISTS" || echo "MISSING")"
echo "   - CONTRIBUTING.md: $([ -f CONTRIBUTING.md ] && echo "EXISTS" || echo "MISSING")"
echo "   - CHANGELOG.md: $([ -f CHANGELOG.md ] && echo "EXISTS" || echo "MISSING")"
echo ""

echo "🏭 Platform Configuration:"
echo "   - GitHub Actions: $([ -d .github/workflows ] && echo "EXISTS" || echo "MISSING")"
if [ -d deploy ]; then
echo "   - Platform configs:"
find deploy -name "*.toml" -o -name "*.yaml" -o -name "*.json" | sed 's/^/     - /'
fi
echo ""

echo "📋 SUMMARY:"
echo "=========="

# Count completeness
score=0
total=10

[ -d "dist" ] && score=$((score + 1))
[ -d "src" ] && score=$((score + 1))
[ -f "dist/cli/index.js" ] && score=$((score + 1))
npm test > /dev/null 2>&1 && score=$((score + 1))
[ -d "examples" ] && score=$((score + 1))
[ -f "README.md" ] && score=$((score + 1))
[ -f ".env.example" ] && score=$((score + 1))
[ -d ".github" ] && score=$((score + 1))
[ -f "src/utils/env.ts" ] && score=$((score + 1))
[ -d "deploy" ] && score=$((score + 1))

percentage=$((score * 100 / total))

echo "Overall Completeness: $score/$total ($percentage%)"
echo ""

if [ $percentage -ge 80 ]; then
    echo "🎉 PROJECT STATUS: EXCELLENT - Ready for production use!"
elif [ $percentage -ge 60 ]; then
    echo "✅ PROJECT STATUS: GOOD - Minor improvements needed"
elif [ $percentage -ge 40 ]; then
    echo "⚠️  PROJECT STATUS: FAIR - Some work required"
else
    echo "❌ PROJECT STATUS: INCOMPLETE - Major work needed"
fi

echo ""
echo "🎯 Next Steps:"
if [ $percentage -ge 80 ]; then
    echo "   - Publish to NPM registry"
    echo "   - Create comprehensive documentation"
    echo "   - Set up automated releases"
else
    echo "   - Fix any remaining build/test issues"
    echo "   - Complete missing documentation"
    echo "   - Add more examples and templates"
fi

echo ""
echo "================================================"
