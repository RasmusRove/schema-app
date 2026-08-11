# Litium Schema Studio

Build a web application (React + TypeScript) that acts as a schema builder for Litium Accelerator.

The purpose of the app is to let developers define:

- Fields

- Block Templates

- Page Templates

- Block Containers (within page templates)

The app must support both EXPORT and IMPORT of a structured JSON configuration that will later be used by AI (e.g. Cursor) to generate YAML, fragments, and TypeScript interfaces.

---

## Core Requirements

### General

- Use React + TypeScript

- Component-based architecture

- Persist data in localStorage

- Support:

  - Export to JSON

  - Import from JSON (rebuild full state)

- Clean tab-based UI

---

## UI Structure

Create 4 tabs:

1. Block Fields

2. Block Templates

3. Page Fields

4. Page Templates

---

## Field Definition

Each field must include:

- id (string, unique)

- name:

  - sv (string)

  - en (string)

- type (enum):

  MediaPointerImage  

  MediaPointerFile  

  Boolean  

  Decimal  

  Editor  

  Int  

  IntOption  

  Link  

  Multifield  

  MultirowText  

  Pointer  

  Text  

  TextOption  

- multiLanguage (boolean)

---

### Conditional Logic

#### If type = IntOption or TextOption

- options: array of:

  - value (string | number)

  - label:

      sv

      en

#### If type = Pointer

- entityType (enum):

  - WebsitesPage

  - ProductsCategory

- multiSelect (boolean)

#### If type = Multifield

- fields: array of EXISTING field IDs

  (IMPORTANT: user must NOT be able to create new fields inline here)

---

## Block Template

- id (string)

- name:

  - sv

  - en

- fields: array of Block Field IDs

---

## Page Template

- id (string)

- name:

  - sv

  - en

- fields: array of Page Field IDs

### Block Containers

Page templates must support block containers:

Each block container includes:

- id (string)

- allowedBlocks: array of Block Template IDs

A page template can have multiple block containers.

---

## Data Model (STRICT)

Export JSON must follow this structure:

{

  "meta": {

    "instructionsForAI": {

      "ignoreUnchangedYaml": true,

      "syncOnChanges": true,

      "generateFragmentsAndInterfaces": true,

      "generateHtml": false,

      "logProps": true,

      "askIfMissingInfo": true

    }

  },

  "blockFields": [],

  "blockTemplates": [],

  "pageFields": [],

  "pageTemplates": []

}

---

## Critical Rules

- All entities must be normalized (reference by ID only)

- No duplicated field definitions inside templates

- Multifield MUST only reference existing fields

- Prevent duplicate IDs globally

- Validate required properties before saving

---

## Import Functionality

The app must support:

- Uploading a JSON file

- Parsing and validating structure

- Rebuilding:

  - fields

  - templates

  - block containers

- Gracefully handle invalid data

---

## UX Requirements

- Create / Edit / Delete:

  - Fields

  - Templates

- Multi-select UI for fields and allowed blocks

- Dedicated UI for:

  - Block containers inside page templates

- Validation errors shown clearly

- Optional:

  - Live JSON preview panel

---

## Bonus (if possible)

- Drag & drop sorting of fields

- Duplicate field/template functionality

---

## Output

- Fully working React app

- Import + Export JSON functionality

- Clean and scalable code

---

## Important Constraints

- Do NOT generate backend

- Do NOT generate YAML

- Do NOT generate HTML

This app is ONLY responsible for schema definition and JSON output.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://create-schema-cms.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f02a64a3-9964-4a19-9c33-530f131dee03).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
