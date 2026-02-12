# Architecture Reference

Package inventory and dependency rules. For rationale, see [Architecture Explanation](./Explanation.md).

## Packages

### domain/ — Pure business logic

| Package                 | Purpose                                                  |
| ----------------------- | -------------------------------------------------------- |
| clinical-domain         | FHIR R4 resources, repository interfaces, clinical logic |
| platform-domain         | User, Org, auth services, DocumentStore interface        |
| config-domain           | Configuration schemas                                    |
| questionnaire-entities  | Questionnaire templates and utilities                    |
| document-template-kinds | Document scoring and report generation                   |
| video-call-domain       | Video call abstractions                                  |

### infrastructure/ — External service implementations

| Package                         | Purpose                               |
| ------------------------------- | ------------------------------------- |
| google-fhir-web-infrastructure  | Google Cloud Healthcare API (browser) |
| google-fhir-node-infrastructure | Google Cloud Healthcare API (Node.js) |
| firebase-web-infrastructure     | Firebase Auth + Firestore (browser)   |
| firebase-server-infrastructure  | Firebase Admin SDK (Cloud Functions)  |
| daily-co-infrastructure         | Daily.co video integration            |
| document-template-instances     | React document/report templates       |

### apps/ — User-facing applications

| Package   | Purpose                                |
| --------- | -------------------------------------- |
| frontend  | React Router v7 SPA                    |
| functions | Firebase Cloud Functions               |
| firecms   | FireCMS admin interface                |
| aws_infra | AWS CDK for Daily.co recording storage |

### global/ — Project-agnostic shared code

| Package                                             | Purpose                          |
| --------------------------------------------------- | -------------------------------- |
| ontology                                            | Shared types and utilities       |
| react-util                                          | React components and hooks       |
| util                                                | Framework-agnostic utilities     |
| testing-utils                                       | VCR-style HTTP testing utilities |
| daily-co-components                                 | Daily.co React components        |
| eslint-config / prettier-config / typescript-config | Shared tool configs              |

## Dependency Rules

| Layer          | May depend on                  | Must not depend on           |
| -------------- | ------------------------------ | ---------------------------- |
| domain         | global, other domain packages  | infrastructure, apps         |
| infrastructure | domain, global                 | apps, other infrastructure   |
| apps           | domain, infrastructure, global | other apps                   |
| global         | nothing project-specific       | domain, infrastructure, apps |

## Tech Stack

| Layer          | Key technologies                                                    |
| -------------- | ------------------------------------------------------------------- |
| Frontend       | React 19, React Router v7, Vite, Effect-TS, Tundra CSS, CSS Modules |
| Backend        | Firebase Cloud Functions, Effect-TS, Node.js 22                     |
| Domain         | Effect-TS, Effect Schema, Vitest                                    |
| Infrastructure | Firebase SDK/Admin, Google Cloud Healthcare API, Daily.co API       |
