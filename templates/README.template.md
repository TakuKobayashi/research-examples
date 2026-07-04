# README.template.md

# research-examples

[日本語README](./README.ja.md)

A collection of technical experiments, implementation samples, proofs of concept, and exploratory projects.

Whenever I encounter a technology, service, framework, API, library, or developer tool that looks interesting, I try to build something with it and see how it behaves in practice.

The goal of this repository is not to create production-ready services. Instead, it serves as a centralized place to collect technical investigations, experiments, implementation examples, and reusable patterns discovered through hands-on exploration.

Over time, these examples become a searchable knowledge base that helps accelerate future development and reduces the need to rediscover the same solutions repeatedly.

---

## Development Stages

* incubating → Exploring and shaping an idea
* validating → Experimenting and refining
* launched → Stable and reusable as a reference implementation
* archived → Preserved as a historical or technical asset

---

## Projects

| Project | Description | status |
| ------- | ----------- | ------ |
{{PROJECT_TABLE_EN}}

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

* Centralized discovery of experiments and samples
* Independent repository management
* Reusable implementation patterns
* Consistent project metadata management

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
