# GEMINI Project Directives

This document outlines the mandatory protocols for AI systems interacting with this codebase.

## 1. Knowledge Base Priority (Read First!)
**MANDATORY**: Before beginning any implementation, analysis, or refactoring, you MUST recursively scan the `docs/` directory.

-   **`docs/infrastructure_design.md`**: The source of truth for the engine's core architecture (Game Loop, Input, Entity Systems).
-   **`docs/graphics_intro.md`**: Rendering mathematics (Projection, Vector3) and philosophical approach.
-   **Game Design Docs** (e.g., `docs/cosmic.md`, `docs/arkanoid_design.md`): Specific rules for the active game.

*Do not assume standard engine behavior (like Unity/Godot) if it conflicts with these docs.*

## 2. Definition of Done (Verification)
A feature or fix is **NOT** complete until:

1.  **Unit Tests**: Run `npm test` (or equivalent) and ensure all tests pass.
2.  **Browser Verification**: The system must verify the project builds (`npm run build`) and runs (`npm run dev`) without console errors.
3.  **Visual Check**: For graphical features, the AI must verify that the visual output matches the design intent (e.g., z-sorting works, collisions trigger correctly).

## 3. Documentation Rigor
Documentation is not an afterthought; it is a deliverable equal in importance to code.

-   **"Textbook" Quality**: All docs must explain the **Why** (Rationale), **What** (Concept), and **How** (Implementation).
-   **Visuals**: Use Mermaid diagrams for ALL complex systems (State Machines, Data Flows, Class Hierarchies).
-   **Accuracy**: Documentation must be strictly kept in sync with code changes. If you refactor code, you **must** refactor the docs.
