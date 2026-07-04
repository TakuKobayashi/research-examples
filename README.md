# README.template.md

# research-examples

[日本語README](./README.ja.md)

A collection of technical experiments, implementation samples, proofs of concept, and exploratory projects.

Whenever I encounter a technology, service, framework, API, library, or developer tool that looks interesting, I try to build something with it and see how it behaves in practice.

The goal of this repository is not to create production-ready services. Instead, it serves as a centralized place to collect technical investigations, experiments, implementation examples, and reusable patterns discovered through hands-on exploration.

Over time, these examples become a searchable knowledge base that helps accelerate future development and reduces the need to rediscover the same solutions repeatedly.

---

## Development Stages

- incubating → Exploring and shaping an idea
- validating → Experimenting and refining
- launched → Stable and reusable as a reference implementation
- archived → Preserved as a historical or technical asset

---

## Projects

| Project                                                                            | Description                                                                                                                                                         | status     |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| [AndroidScreenRecord](./projects/AndroidScreenRecord/)                             | A sample project that uses Android MediaProjection and foreground services to verify the recording process of the terminal screen。                                 | incubating |
| [AndroidWebRTCSample](./projects/AndroidWebRTCSample/)                             | A sample project that検証s WebRTC camera video acquisition, SurfaceViewRenderer display, cameraカメラ, etc. in the Android app。                                    | incubating |
| [aws-lambda-cdk-hono-images](./projects/aws-lambda-cdk-hono-images/)               | TypeScript sample project using CD CDK and Hono to verify image acquisition and HTTP API configuration onmbda。                                                     | incubating |
| [chat-app](./projects/chat-app/)                                                   | Sample chat application built with PartyKit for learning real-time communication, WebSocket architecture, and free hosting possibilities across multiple platforms. | incubating |
| [cloudflare-hono-sample](./projects/cloudflare-hono-sample/)                       | Sample project to verify API implementations Ho Hono, KV, D1 and Prisma on Cloud Workre Workers。                                                                   | incubating |
| [gather-app](./projects/gather-app/)                                               | Virtual workspace and communication platform inspired by Gather, using PartyKit and LiveKit to explore WebSocket/WebRTC architecture and interactive online spaces. | incubating |
| [gatsby-cloud-functions](./projects/gatsby-cloud-functions/)                       | G by Cloud Functions。                                                                                                                                              | incubating |
| [github-api-file-upload](./projects/github-api-file-upload/)                       | A sample project that uses GitHub API and Octokit to verify the creation, update, and uploading of files in the repository。                                        | incubating |
| [github-webhook-api-workflows](./projects/github-webhook-api-workflows/)           | Serverless sample project to verify APIs that handle Actions workflow list, execution history, and dispatch execution in GitHub API。                               | incubating |
| [GodotSample](./projects/GodotSample/)                                             | Small-scale validation samples for Godot 4 basic project configuration and 3D scene creation。                                                                      | incubating |
| [japanese-address-research](./projects/japanese-address-research/)                 | A survey project that uses Japanese address data to verify address normalization and search/convert processing。                                                    | incubating |
| [jets-examples](./projects/jets-examples/)                                         | A sample project to investigate serverless application configuration using Ruby's Jets framework。                                                                  | incubating |
| [livekit-gather-app-sample](./projects/livekit-gather-app-sample/)                 |                                                                                                                                                                     | incubating |
| [mermaid-doc-sample](./projects/mermaid-doc-sample/)                               | A sample project to verify whether you can create and display diagrams for documents such as ER diagrams in Mer notation。                                          | incubating |
| [MLKitSample](./projects/MLKitSample/)                                             | Verification sample using CameraX and Google ML Kit on Android。                                                                                                    | incubating |
| [mmd-parser-sample](./projects/mmd-parser-sample/)                                 | a validation project that uses mmd-parser to load MMD's PMX model files and VMD motion files in Node.js/Serverless environments。                                   | incubating |
| [NearbyConnectionSample](./projects/NearbyConnectionSample/)                       | A sample project that uses the Nearby Connections API of Android to verify advertisement, detection, connection, and payload transmission between terminals。       | incubating |
| [netlify-cms-functions](./projects/netlify-cms-functions/)                         | A sample project that incorporates Netlify Functions and Netlify CMS to the G by site and investigates the operation of CMS management and Functions。              | incubating |
| [netlify-cms-functions-typescript](./projects/netlify-cms-functions-typescript/)   | A sample project that verifies Netlify CMS and G by theme configuration based on TypeScript enabled G by Material Starter。                                         | incubating |
| [nextjs-cloudflare-pages-sample](./projects/nextjs-cloudflare-pages-sample/)       | A sample project that verifies the procedure and configuration to deploy static sites created in Next.js to Cloud re Pages。                                        | incubating |
| [nextjs-spotify-player](./projects/nextjs-spotify-player/)                         | A sample project that uses the Spotify Web Playback SDK from Next.js to verify how to play Spotify on your browser。                                                | incubating |
| [nextjs-typescript-blog-sample](./projects/nextjs-typescript-blog-sample/)         | Next.js and TypeScript create Markdown-based blog sites and verify dynamic routing and Markdown conversion。                                                        | incubating |
| [nextjs-webrtc-sample](./projects/nextjs-webrtc-sample/)                           | A sample project that uses WebRTC to test real-time communication between browsers。                                                                                | incubating |
| [notion-api-examples](./projects/notion-api-examples/)                             | A sample project that uses the Notion API and the Notion SDK to verify how to handle Notion data from Verify and Serverless Framework。                             | incubating |
| [partykit-websocket-chat-samples](./projects/partykit-websocket-chat-samples/)     |                                                                                                                                                                     | incubating |
| [PushNotification](./projects/PushNotification/)                                   | Android sample project, including Kotlin and C++ native code, intended to verify Android push notifications and native cooperation。                                | incubating |
| [python-aws-lambda](./projects/python-aws-lambda/)                                 | A sample project that builds applications for Python da in Python and verifies development environments including Challice and dependency management。              | incubating |
| [python-opencv](./projects/python-opencv/)                                         | Sample project to verify image processing and local execution environment using Python and OpenCV。                                                                 | incubating |
| [serverless-ffmpeg](./projects/serverless-ffmpeg/)                                 | TypeScript sample project that uses Serverless Framework and Express to verify the configuration of using ffmpeg on Serverda。                                      | incubating |
| [serverless-github-upload-reources](./projects/serverless-github-upload-reources/) | A sample project that uses Serverless Framework, Verify and Octokit to verify the resource upload API to the GitHub repository。                                    | incubating |
| [serverless-google-photos](./projects/serverless-google-photos/)                   | TypeScript sample project that handles Google Photos API and googleapis on Serverless Framework to verify photo data collaboration。                                | incubating |
| [serverless-nestjs-sample](./projects/serverless-nestjs-sample/)                   | A sample project that verifies the configuration of the ServerJS application on Server da with Serverless Framework and serverless-express。                        | incubating |
| [serverless-plantscale-mysql](./projects/serverless-plantscale-mysql/)             | A sample project that uses Serverless Framework and Fastify to verify the connection to PlanetScale MySQL and serverless API configuration。                        | incubating |
| [serverless-puppeteer](./projects/serverless-puppeteer/)                           | A sample project that runs puppeteer-core and chromium on pu da to verify browser auto-operation in serverless environments。                                       | incubating |
| [serverless-python-docker](./projects/serverless-python-docker/)                   | A sample project that uses Python and Docker in Serverless Framework to verify the container execution environment for Serverda。                                   | incubating |
| [serverless-python-flask](./projects/serverless-python-flask/)                     | A sample project that uses Serverless Framework to verify the configuration of deploying Python and Flask applications to Python da。                               | incubating |
| [turnless-webrtc-sample](./projects/turnless-webrtc-sample/)                       | Next.js sample project for WebRTC video chat and data channel communication with STUN only without TURN server。                                                    | incubating |
| [twitter-api-v2-sample](./projects/twitter-api-v2-sample/)                         | A TypeScript sample project that uses the Twitter API v2 SDK from Serverless Framework and Fastify to verify API collaboration。                                    | incubating |
| [webpush-sample-with-demo](./projects/webpush-sample-with-demo/)                   | Cloudデモre Workers Assets and Next.js。                                                                                                                            | incubating |
| [WifiP2PSample](./projects/WifiP2PSample/)                                         | A sample project to verify the basics of inter-ter communication using Android’s Wi-Fi Direct/Wi-Fi P2P。                                                           | incubating |

---

## Development Workflow

### Create a New Project

```bash
npm run projects:add -- --name my-new-project --description "Project description"
```

### Sync README

```bash
npm run projects:sync
```

### Validate project.yml Files

```bash
npm run projects:validate
```

---

## Submodule Workflow

### Clone Repository Including Submodules

```bash
git clone --recurse-submodules <repo-url>
```

### Pull Latest Changes (Parent Repository + All Submodules)

```bash
npm run projects:pull
```

### Push Changes to All Repositories

```bash
npm run projects:push
```

### Check Repository Status

```bash
npm run projects:status
```

---

## Repository Strategy

Projects are initially created and managed under the `projects/` directory.

As experiments grow larger or become useful reference implementations, they may be moved into their own repositories while remaining discoverable from this repository through Git Submodules.

This approach provides:

- Centralized discovery of experiments and samples
- Independent repository management
- Reusable implementation patterns
- Consistent project metadata management

Example:

```
projects/
├── project-a
├── project-b
└── project-c
```

↓

```
projects/
├── project-a (Submodule)
├── project-b (Submodule)
└── project-c
```

### Moving a Project to Its Own Repository

```
cd projects/my-project
```

Create a new GitHub repository and push the project:

```
git init
git add .
git commit -m "Initial commit"

git branch -M main

git remote add origin https://github.com/<user>/my-project.git

git push -u origin main
```

Remove the local directory from the parent repository:

```
git rm -r projects/my-project

git commit -m "Remove local project"
```

Add it back as a Git Submodule:

```
git submodule add https://github.com/<user>/my-project.git projects/my-project

git commit -m "Add submodule"
```

### Clone Repository with Submodules

```
git clone --recursive <repository-url>
```

### Initialize Existing Submodules

```
git submodule update --init --recursive
```

### Update All Submodules

```
git submodule update --remote
```

### Remove an Incorrectly Added Submodule

```
git submodule deinit -f projects/my-project

git rm -f projects/my-project

rm -rf .git/modules/projects/my-project
```