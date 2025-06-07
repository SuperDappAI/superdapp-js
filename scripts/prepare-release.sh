#!/bin/bash

# SuperDapp JS SDK Release Preparation Script
set -e

echo "🚀 Preparing SuperDapp JS SDK for release..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if we're on the main branch
if [ "$(git branch --show-current)" != "main" ]; then
    print_warning "Not on main branch. Current branch: $(git branch --show-current)"
    read -p "Continue anyway? (y/N): " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    print_error "You have uncommitted changes. Please commit or stash them first."
    git status
    exit 1
fi

print_status "Running pre-release checks..."

# Install dependencies
print_status "Installing dependencies..."
npm ci

# Run linting
print_status "Running linter..."
npm run lint

# Run tests
print_status "Running tests..."
npm test

# Build the project
print_status "Building project..."
npm run build

# Check if build artifacts exist
if [ ! -d "dist" ]; then
    print_error "Build failed - dist directory not found"
    exit 1
fi

# Verify CLI works
print_status "Testing CLI..."
if ! node dist/cli/index.js --version > /dev/null 2>&1; then
    print_error "CLI test failed"
    exit 1
fi

# Check package.json fields
print_status "Validating package.json..."
required_fields=("name" "version" "description" "main" "types" "bin" "repository" "keywords" "author" "license")
for field in "${required_fields[@]}"; do
    if ! jq -e ".$field" package.json > /dev/null 2>&1; then
        print_error "Missing required field in package.json: $field"
        exit 1
    fi
done

# Security audit
print_status "Running security audit..."
npm audit --audit-level moderate

# Check dependencies
print_status "Checking for unused dependencies..."
if command -v depcheck > /dev/null 2>&1; then
    depcheck
else
    print_warning "depcheck not installed, skipping dependency check"
fi

# Check for TypeScript errors
print_status "Checking TypeScript compilation..."
npx tsc --noEmit

# Verify documentation exists
print_status "Checking documentation..."
required_docs=("README.md" "CHANGELOG.md" "CONTRIBUTING.md" "SECURITY.md")
for doc in "${required_docs[@]}"; do
    if [ ! -f "$doc" ]; then
        print_error "Missing documentation file: $doc"
        exit 1
    fi
done

# Check examples
print_status "Verifying examples..."
if [ ! -d "examples" ]; then
    print_error "Examples directory not found"
    exit 1
fi

# Verify deployment configurations
print_status "Checking deployment configurations..."
deploy_configs=("deploy/cloudflare/wrangler.toml" "deploy/aws/template.yaml" "deploy/vercel/vercel.json")
for config in "${deploy_configs[@]}"; do
    if [ ! -f "$config" ]; then
        print_error "Missing deployment configuration: $config"
        exit 1
    fi
done

# Check CI/CD configuration
if [ ! -f ".github/workflows/ci-cd.yml" ]; then
    print_error "CI/CD workflow not found"
    exit 1
fi

# Get current version
CURRENT_VERSION=$(jq -r '.version' package.json)
print_status "Current version: $CURRENT_VERSION"

# Ask for release type
echo "Select release type:"
echo "1) patch (bug fixes)"
echo "2) minor (new features)"
echo "3) major (breaking changes)"
read -p "Enter choice (1-3): " release_type

case $release_type in
    1) npm_version_arg="patch" ;;
    2) npm_version_arg="minor" ;;
    3) npm_version_arg="major" ;;
    *) print_error "Invalid choice"; exit 1 ;;
esac

# Bump version
print_status "Bumping version ($npm_version_arg)..."
npm version $npm_version_arg --no-git-tag-version

NEW_VERSION=$(jq -r '.version' package.json)
print_success "Version bumped to: $NEW_VERSION"

# Update changelog
print_status "Please update CHANGELOG.md with release notes for version $NEW_VERSION"
read -p "Press Enter when changelog is updated..."

# Final build with new version
print_status "Final build..."
npm run build

# Commit version bump
print_status "Committing version bump..."
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore: bump version to $NEW_VERSION"

# Create git tag
print_status "Creating git tag..."
git tag -a "v$NEW_VERSION" -m "Release version $NEW_VERSION"

print_success "Release preparation complete!"
print_status "Next steps:"
echo "  1. Push to GitHub: git push origin main --tags"
echo "  2. Create GitHub release"
echo "  3. Publish to NPM: npm publish"
echo "  4. Deploy to production"

print_warning "Remember to:"
echo "  - Update documentation if needed"
echo "  - Announce the release"
echo "  - Monitor for issues"
