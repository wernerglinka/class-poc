# Contributing to Metalsmith2025 Structured Content Starter

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm start`
4. Make your changes
5. Run tests: `npm test`
6. Format code: `npm run format`
7. Commit and push your changes

## Code Formatting

We use Prettier for code formatting. Run `npm run format` before committing changes.

### Nunjucks Template Files

**All Nunjucks template files (`.njk`) are excluded from Prettier formatting** due to widespread compatibility issues between Prettier and Nunjucks syntax.

**Why this happens:** Prettier's Nunjucks parser has multiple limitations:
- Cannot parse dynamic HTML tag expressions like `<{{ variable }}>`
- Mangles complex Nunjucks conditionals by breaking them across lines incorrectly  
- Creates invalid syntax when reformatting template blocks and expressions
- Breaks multi-line template logic within HTML attributes
- Cannot handle nested template expressions properly

**Common problematic patterns:**
- Dynamic HTML tags: `<{{ titleTag }}>content</{{ titleTag }}>`
- Multi-line conditionals in attributes: `{% if condition %}attribute="value"{% endif %}`
- Complex nested template logic and macros
- Template expressions within HTML attribute values

**What to do:** When editing `.njk` files, format them manually using consistent indentation and spacing to match the project's style. The `npm run format` command will automatically skip all `.njk` files to prevent syntax corruption.

## Testing

The project includes comprehensive tests:

- **Build Integration Tests**: Validate the Metalsmith build pipeline
- **Component Manifest Tests**: Ensure all components have valid manifests
- **Content Structure Tests**: Verify frontmatter and data file structure
- **Component Dependency Tests**: Test the bundling system

Run tests with `npm test`. All tests must pass before submitting a pull request.

## Validation System

The project includes a validation system for catching configuration errors in frontmatter. When adding new components:

1. Add validation rules to the component's `manifest.json`
2. Base enum validations on actual CSS classes (not hardcoded values)
3. Focus on catching "silent failures" (wrong data types, invalid enums)
4. Test validation with both valid and invalid configurations

## Component Development

When creating new components:

1. Follow the existing component structure in `lib/layouts/components/`
2. Include a `manifest.json` file with dependencies and validation rules
3. Use semantic HTML and accessible markup
4. Add JSDoc comments explaining the component's purpose
5. Update tests to include the new component

## Commit Messages

Use conventional commit format:
- `feat:` for new features
- `fix:` for bug fixes  
- `chore:` for maintenance tasks
- `docs:` for documentation changes

## Pull Requests

1. Create a descriptive title and detailed description
2. Reference any related issues
3. Ensure all tests pass
4. Include documentation updates if needed
5. Request review from maintainers

## Questions?

Feel free to open an issue for questions or join the [Metalsmith community on Gitter](https://gitter.im/metalsmith/community).