# Shift-Left Debugging Guide (Chrome MCP)

## Overview
GaborPortfolio is **Agent-Aware** — the AI agent can "see" and interact with the localhost browser via MCP.

- **Target**: Browser on port `9222`
- **Translator**: `@modelcontextprotocol/server-puppeteer`
- **Agent**: Your AI IDE (Cursor / Claude / Antigravity)

## Setup Protocol

**Terminal 1 — Launch Chrome with remote debugging:**
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-debug \
  http://localhost:5173
```

**Terminal 2 — Run the app:**
```bash
npm run dev
```

**AI client config** (`claude_desktop_config.json` or equivalent):
```json
{
  "mcpServers": {
    "chrome": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    }
  }
}
```

Once connected the agent can: click buttons, read console logs for silent errors, and verify ARIA labels in real-time.

---

## Vitest Unit Testing Strategy

| Command | Purpose |
|---|---|
| `npm test` | Watch mode |
| `npm run test:ci` | Single run (CI/CD) |

**Test file pattern**: `Component.test.tsx` alongside the component.

| Topic | Guidance |
|---|---|
| **i18n mocking** | `src/setupTests.ts` globally mocks `react-i18next`. Use `vi.mock` only when spying on `changeLanguage`. |
| **User interactions** | Use `@testing-library/user-event` for realistic clicks/typing. |

**Critical coverage areas:**
- `LanguageDial.test.tsx` — language switching / i18n trigger
- `SocialDock.test.tsx` — external link security (`noopener noreferrer`)
- `Gauge.test.tsx` + `ProjectCard.test.tsx` — core logic

---

## SEO Validation Tools
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
