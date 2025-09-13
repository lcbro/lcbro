# Publishing LCBro to npm

This document explains how to publish LCBro as an npm package for global installation.

## Prerequisites

1. **npm account**: Create an account at [npmjs.com](https://npmjs.com)
2. **Login**: `npm login` to authenticate with npm
3. **Package name availability**: Ensure `lcbro` is available on npm

## Publishing Steps

### 1. Prepare the Package

```bash
# Build the project
npm run build

# Test the build
npm test

# Verify the CLI works
node dist/cli.js --help
```

### 2. Check Package Contents

```bash
# Preview what will be published
npm pack --dry-run

# This should show:
# - dist/ (compiled JavaScript)
# - config/ (default configuration)
# - scripts/ (utility scripts)
# - README.md
# - package.json
```

### 3. Version Management

```bash
# Check current version
npm version

# For patch updates (bug fixes)
npm version patch

# For minor updates (new features)
npm version minor

# For major updates (breaking changes)
npm version major
```

### 4. Publish to npm

```bash
# Publish to npm
npm publish

# For scoped packages (if needed)
npm publish --access public
```

### 5. Verify Installation

After publishing, users can install globally:

```bash
# Install globally
npm install -g lcbro

# Verify installation
lcbro --version

# Start the server
lcbro

# With options
lcbro --cdp-enabled --logs-dir /tmp/lcbro-logs
```

## Package Structure

```
lcbro/
├── dist/                    # Compiled JavaScript
│   ├── cli.js              # CLI entry point
│   ├── index.js            # Main server
│   ├── server.js           # Server implementation
│   └── ...                 # Other compiled files
├── config/                 # Default configuration
│   └── default.yaml
├── scripts/                # Utility scripts
│   ├── cdp-browser-launcher.sh
│   ├── logs-manager.sh
│   └── test-remote-cdp.sh
├── examples/               # Usage examples
│   └── basic-usage.js
├── README.md               # Documentation
├── package.json            # Package metadata
└── .npmignore              # Files to exclude
```

## Configuration

The package includes:
- **Default configuration**: `config/default.yaml`
- **CLI overrides**: Command-line options for all settings
- **Environment variables**: Support for configuration via env vars

## Usage Examples

### Global Installation
```bash
npm install -g lcbro
lcbro --help
```

### Local Installation
```bash
npm install lcbro
npx lcbro --help
```

### Docker Usage
```bash
# Build Docker image
docker build -t lcbro .

# Run with Docker
docker run -p 3000:3000 lcbro
```

## Maintenance

### Updating the Package

1. Make changes to the code
2. Update version: `npm version patch/minor/major`
3. Build: `npm run build`
4. Test: `npm test`
5. Publish: `npm publish`

### Deprecating Versions

```bash
# Deprecate a version
npm deprecate lcbro@1.0.0 "This version has security issues"
```

### Unpublishing

```bash
# Unpublish (only within 24 hours)
npm unpublish lcbro@1.0.0

# Unpublish all versions (only within 24 hours)
npm unpublish lcbro --force
```

## Troubleshooting

### Common Issues

1. **Package name taken**: Choose a different name or use scoped package
2. **Build errors**: Fix TypeScript compilation errors
3. **Missing files**: Check `.npmignore` configuration
4. **Permission errors**: Ensure you're logged in with `npm login`

### Verification Commands

```bash
# Check package info
npm info lcbro

# Check package contents
npm pack --dry-run

# Test local installation
npm pack
npm install -g ./lcbro-1.0.0.tgz
```

## Security Considerations

1. **Dependencies**: Regularly update dependencies for security patches
2. **Permissions**: Only publish with appropriate npm permissions
3. **Secrets**: Never include API keys or secrets in the package
4. **Audit**: Run `npm audit` before publishing

## Documentation

Keep documentation updated:
- README.md with installation instructions
- API documentation in code comments
- Examples in the `examples/` directory
- Configuration documentation

## Support

- **Issues**: GitHub Issues for bug reports
- **Discussions**: GitHub Discussions for questions
- **Documentation**: Keep README.md updated
- **Examples**: Provide working examples
