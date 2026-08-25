[English](./README.md) | [한국어](./README.ko.md)

# OMP Skill

[Oh My Pi](https://omp.sh/docs)를 위한 Agent Skill입니다. 설치, 설정, 세션, 모델 라우팅, 도구, 서브에이전트, 브라우저와 GitHub 연동, 확장 기능, MCP, 플러그인, SDK, RPC, ACP, 문제 해결 방법을 다룹니다.

2026년 8월 25일 기준 OMP 공식 문서에 노출된 56개 경로를 모두 조사해 작성했습니다.

## 설치

현재 프로젝트에서 감지된 에이전트에 설치합니다.

```sh
npx skills add j-token/omp-skill --skill omp
```

전역에 설치하고 확인 질문을 생략합니다.

```sh
npx skills add j-token/omp-skill --skill omp -g -y
```

설치 전에 저장소에서 제공하는 스킬을 확인할 수 있습니다.

```sh
npx skills add j-token/omp-skill --list
```

이 저장소는 표준 `skills/omp/SKILL.md` 구조를 사용합니다. [Skills CLI](https://github.com/vercel-labs/skills)와 [Agent Skills 규격](https://agentskills.io/specification)에 호환됩니다.

## 사용법

설치한 코딩 에이전트에 OMP 관련 작업을 평소처럼 요청하면 됩니다. `omp` CLI/TUI, `.omp/` 설정, provider, 모델, 세션, 도구, 서브에이전트, hook, MCP, plugin, OMP API 관련 요청에서 이 스킬이 사용됩니다.

예시:

```text
프로젝트 단위로 OMP 모델 역할을 설정하고 shell 실행은 항상 승인받게 해줘.
```

```text
Rust에서 OMP RPC protocol v2 host를 만들고 chunk frame을 안전하게 처리해줘.
```

```text
.omp skill이 /skill 명령으로는 실행되는데 자동으로 로드되지 않는 이유를 찾아줘.
```

## 구성

```text
skills/omp/
├── SKILL.md
├── evals/
│   └── evals.json
└── references/
    ├── coding-and-integrations.md
    ├── docs-index.md
    ├── extension-ecosystem.md
    ├── models-and-customization.md
    ├── programmatic-reference.md
    └── start-and-sessions.md
```

`SKILL.md`는 요청에 필요한 참조 문서만 선택합니다. `docs-index.md`에는 조사한 공식 문서 경로와 각 참조 문서의 연결 관계가 들어 있습니다.

## 출처

- [OMP 공식 문서](https://omp.sh/docs)
- [Skills CLI](https://github.com/vercel-labs/skills)
- [Agent Skills 규격](https://agentskills.io/specification)
