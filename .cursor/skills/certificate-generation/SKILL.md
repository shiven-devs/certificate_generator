---
name: certificate-generation
description: Generate, validate, store and securely serve completion certificates using the project's PDF/image template. Use whenever implementing certificate rendering, download, regeneration or certificate storage.
---

# Certificate Generation Skill

## Eligibility

A certificate may be generated ONLY after the server verifies:

- authenticated user
- correct enrollment ownership
- course completion
- all required videos completed
- no client-provided completion flag is trusted

## Rendering

Use the template chosen by the project.

For PDF templates:
prefer pdf-lib and fontkit.

For image templates:
use the project's selected image rendering implementation.

Do not modify the original template permanently.

Generate a new certificate artifact.

## Layout

Certificate text placement must be calibrated against the actual template.

Do not guess final coordinates.

Account for:

- font
- font size
- text width
- alignment
- long course names
- long user names

Prevent text overflow.

## Storage

Generated certificates should be stored using the project's configured storage system.

Do not expose storage credentials to the browser.

Store a stable certificate reference on the enrollment/certificate record.

## Download authorization

Every certificate download must verify ownership server-side.

Never assume that knowing a certificate URL is sufficient authorization.

## Duplicate generation

Prevent accidental duplicate generation.

If a valid certificate already exists, return/reuse it unless explicit regeneration is supported.

## Security

Do not allow arbitrary user input to become:

- file paths
- executable content
- unsafe template paths

## Verification

Test with:

- short name
- long name
- unusual characters
- long course title
- repeated generation
- unauthorized user
- incomplete course
- missing template
- storage failure
