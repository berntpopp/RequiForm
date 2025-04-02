# Migration Guide for RequiForm Schema Updates

## Overview

This guide outlines the steps for migrating changes to the RequiForm JSON schemas (PDF Schema and Test Schema). The schema versioning strategy enables us to manage updates while maintaining backward compatibility.

## Schema Versioning Strategy

Each JSON schema file now includes a top-level `schema` object with the following properties:

- **name**: A descriptive name for the schema.
- **version**: A semantic version number following the `MAJOR.MINOR.PATCH` format (e.g., `1.0.0`).

**Example (PDF Schema):**

```json
"schema": {
  "name": "RequiForm PDF Schema",
  "version": "1.0.0"
}
