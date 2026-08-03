---
format: seqvio-editorial-plan
id: native-module-ci-editorial
duration_budget_sec: 75
---

# Editorial Plan: Why node-pty still fails after rebuild

## Objective

Explain why a successful npm rebuild message does not prove that a native module can be loaded, then show a verifiable repair.

## Audience

Node.js maintainers who understand npm and CI but do not routinely debug native addons.

### Prior Knowledge

- npm installs package dependencies
- CI runs commands in a clean environment

### Likely Misconceptions

- A zero rebuild exit code guarantees that pty.node exists
- Re-running the same rebuild command is a sufficient verification

## Thesis

The rebuild command can succeed while npm blocks the install script that produces pty.node, so verification must test both the artifact and the import.

## Explanation Strategy

### Causal diagnosis

- ID: `causal-diagnosis`
- Role: **primary**
- Reason: The source contains an observed failure, an expected install path, a break point, a root cause, and a verifiable repair.
- Adaptations:
  - Combine repair and verification into the final section to stay within the duration budget.

### Evidence demonstration

- ID: `evidence-demonstration`
- Role: **supporting**
- Reason: The conclusion must be supported by checking the native artifact and importing the module, not by trusting the rebuild message.

## Content Decisions

### Command success and native artifact existence are different conditions.

- ID: `success-is-not-artifact`
- Decision: **include**
- Role: essential
- Reason: This corrects the misconception exposed by the CI log.
- Prerequisites: none
- Estimate: 12s

### node-pty needs its install script to produce a platform-specific pty.node binary.

- ID: `native-install-path`
- Decision: **include**
- Role: essential
- Reason: The viewer needs a causal model before seeing the blocked step.
- Prerequisites: `success-is-not-artifact`
- Estimate: 18s

### allowScripts blocked the install step, leaving no loadable binary.

- ID: `blocked-script`
- Decision: **include**
- Role: evidence
- Reason: This is the direct cause supported by the npm warning.
- Prerequisites: `native-install-path`
- Estimate: 16s

### Allow the required script, rebuild, and verify with an actual import.

- ID: `repair-and-import`
- Decision: **include**
- Role: example
- Reason: The repair is incomplete without executable verification.
- Prerequisites: `blocked-script`
- Estimate: 20s

### Review the complete history of Node ABI versions.

- ID: `abi-history`
- Decision: **omit**
- Role: optional
- Reason: It does not help diagnose the observed blocked-script failure.
- Prerequisites: none

## Explanation Structure

### 1. The misleading success signal

- ID: `symptom`
- Purpose: hook
- Concepts: `success-is-not-artifact`
- Audience outcome: The viewer stops treating the rebuild message as proof of loadability.
- Target: 12s

### 2. What must happen during install

- ID: `install-path`
- Purpose: establish-model
- Concepts: `native-install-path`
- Audience outcome: The viewer can name the step that creates pty.node.
- Target: 18s

### 3. Where the path was blocked

- ID: `root-cause`
- Purpose: explain-mechanism
- Concepts: `blocked-script`
- Audience outcome: The viewer connects the allowScripts warning to the missing binary.
- Target: 16s

### 4. Repair and verify

- ID: `repair`
- Purpose: demonstrate
- Concepts: `repair-and-import`
- Audience outcome: The viewer verifies the fix with an import rather than another success message.
- Target: 20s
