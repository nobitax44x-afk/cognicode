export interface SampleProject {
  id: string;
  name: string;
  description: string;
  language: string;
  color: string;
  files: { path: string; content: string }[];
}

export const SAMPLE_PROJECTS: SampleProject[] = [
  {
    id: 'pulse-monitor',
    name: 'pulse-monitor',
    description:
      'A zero-dependency CLI that watches your HTTP endpoints, tracks uptime history, and alerts you when a service goes down.',
    language: 'TypeScript',
    color: '#3178c6',
    files: [
      {
        path: 'package.json',
        content: JSON.stringify(
          {
            name: 'pulse-monitor',
            version: '1.3.0',
            description:
              'A zero-dependency CLI that watches your HTTP endpoints, tracks uptime history, and alerts when a service goes down.',
            license: 'MIT',
            type: 'module',
            bin: { 'pulse-monitor': 'dist/index.js' },
            scripts: {
              build: 'tsc',
              start: 'node dist/index.js',
              dev: 'tsx watch src/index.ts',
              test: 'vitest run',
              lint: 'eslint .',
            },
            dependencies: {
              chalk: '^5.3.0',
              'node-fetch': '^3.3.2',
            },
            devDependencies: {
              typescript: '^5.5.0',
              vitest: '^2.0.0',
              eslint: '^9.0.0',
            },
          },
          null,
          2,
        ),
      },
      {
        path: 'tsconfig.json',
        content: JSON.stringify(
          {
            compilerOptions: {
              target: 'ES2022',
              module: 'NodeNext',
              moduleResolution: 'NodeNext',
              outDir: 'dist',
              strict: true,
            },
            include: ['src'],
          },
          null,
          2,
        ),
      },
      {
        path: 'src/index.ts',
        content: `import { Monitor } from './monitor.js';

const targets = process.env.TARGETS?.split(',').map((t) => t.trim()) ?? ['https://example.com'];
const intervalMs = Number(process.env.INTERVAL_MS ?? 30000);

const monitor = new Monitor({ targets, intervalMs });
monitor.start();

process.on('SIGINT', () => {
  monitor.stop();
  process.exit(0);
});
`,
      },
      {
        path: 'src/monitor.ts',
        content: `export interface Target { url: string; }

export interface MonitorOptions {
  targets: string[];
  intervalMs: number;
}

export class Monitor {
  private readonly targets: string[];
  private readonly intervalMs: number;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(options: MonitorOptions) {
    this.targets = options.targets;
    this.intervalMs = options.intervalMs;
  }

  start() {
    this.timer = setInterval(() => void this.check(), this.intervalMs);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
  }

  private async check() {
    for (const url of this.targets) {
      try {
        const res = await fetch(url);
        console.log(\`[pulse] \${url} -> \${res.status}\`);
      } catch {
        console.error(\`[pulse] \${url} -> DOWN\`);
      }
    }
  }
}
`,
      },
      {
        path: '.github/workflows/ci.yml',
        content: `name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run lint
      - run: npm test
`,
      },
      {
        path: 'src/monitor.test.ts',
        content: `import { describe, it, expect } from 'vitest';
import { Monitor } from './monitor.js';

describe('Monitor', () => {
  it('starts and stops without throwing', () => {
    const monitor = new Monitor({ targets: ['https://example.com'], intervalMs: 60000 });
    monitor.start();
    monitor.stop();
    expect(true).toBe(true);
  });
});
`,
      },
    ],
  },
  {
    id: 'aether-api',
    name: 'aether-api',
    description:
      'A small, typed FastAPI service for collaborative task boards with SQLite persistence and Docker support.',
    language: 'Python',
    color: '#3776ab',
    files: [
      {
        path: 'requirements.txt',
        content: 'fastapi==0.115.0\nuvicorn[standard]==0.30.0\npydantic==2.8.0\nsqlalchemy==2.0.32',
      },
      {
        path: 'pyproject.toml',
        content: `[tool.black]
line-length = 100

[tool.isort]
profile = "black"
`,
      },
      {
        path: 'app/main.py',
        content: `from fastapi import FastAPI
from app.models import Board, Task

app = FastAPI(title="Aether API", version="0.2.0")


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@app.post("/boards")
async def create_board(board: Board) -> Board:
    return board


@app.post("/boards/{board_id}/tasks")
async def create_task(board_id: str, task: Task) -> Task:
    return task
`,
      },
      {
        path: 'app/models.py',
        content: `from pydantic import BaseModel
from datetime import datetime


class Board(BaseModel):
    id: str
    name: str
    created_at: datetime = datetime.utcnow()


class Task(BaseModel):
    id: str
    board_id: str
    title: str
    done: bool = False
`,
      },
      {
        path: 'Dockerfile',
        content: `FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
`,
      },
    ],
  },
  {
    id: 'forge-cli',
    name: 'forge-cli',
    description:
      'A fast Go CLI that scaffolds new project folders from templates — complete with sensible gitignore, license, and CI files.',
    language: 'Go',
    color: '#00add8',
    files: [
      {
        path: 'go.mod',
        content: 'module github.com/yourname/forge\n\ngo 1.22\n\nrequire github.com/spf13/cobra v1.8.0',
      },
      {
        path: 'main.go',
        content: `package main

import (
    "fmt"
    "os"

    "github.com/yourname/forge/internal/scaffold"
    "github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
    Use:   "forge",
    Short: "Scaffold new project folders from templates",
    RunE: func(cmd *cobra.Command, args []string) error {
        name := args[0]
        return scaffold.Create(name)
    },
}

func main() {
    if err := rootCmd.Execute(); err != nil {
        fmt.Fprintln(os.Stderr, err)
        os.Exit(1)
    }
}
`,
      },
      {
        path: 'internal/scaffold/create.go',
        content: `package scaffold

import (
    "fmt"
    "os"
    "path/filepath"
)

// Create generates a standard project skeleton at ./<name>.
func Create(name string) error {
    dir := filepath.Join(".", name)
    if _, err := os.Stat(dir); err == nil {
        return fmt.Errorf("directory %q already exists", name)
    }
    if err := os.MkdirAll(filepath.Join(dir, "cmd"), 0o755); err != nil {
        return err
    }
    return os.WriteFile(filepath.Join(dir, ".gitignore"), []byte("bin/\n"), 0o644)
}
`,
      },
      {
        path: 'Makefile',
        content: `.PHONY: build test lint

build:
	go build -o bin/forge ./...

test:
	go test ./...

lint:
	go vet ./...
`,
      },
      {
        path: 'internal/scaffold/create_test.go',
        content: `package scaffold

import (
    "os"
    "testing"
)

func TestCreate(t *testing.T) {
    name := "tmp-project-test"
    if err := Create(name); err != nil {
        t.Fatal(err)
    }
    defer os.RemoveAll(name)
    if _, err := os.Stat(name + "/cmd"); os.IsNotExist(err) {
        t.Fatal("expected cmd directory to be created")
    }
}
`,
      },
    ],
  },
];
