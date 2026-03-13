---
name: circuit_design
description: Translates textual requirements into structured electronic circuit designs.
---

# Circuit Design Skill

## Purpose
This skill is responsible for translating a textual requirement into a structured circuit design, including component selection, topology design, and parameter definition.

## Design Workflow
1.  **Requirement Mapping**: Analyze user specifications (e.g., "1kHz cutoff", "5V gain of 2").
2.  **Architecture Selection**: Choose a topology (e.g., Sallen-Key for filters, Non-inverting for amplifiers).
3.  **Component Calculation**:
    -   Use design formulas (e.g., $R = \frac{1}{2\pi f_c C}$) to determine initial values.
    -   Select standard E12 or E24 series component values.
4.  **Layout Planning**: Determine $x, y$ coordinates for components on the playground canvas.
5.  **Connection Logic**: Define source and target ports for each wire.

## Design Principles
-   **Signal Flow**: Left-to-right (Input to Output).
-   **Power Rails**: Positive on top, Negative/Ground on bottom.
-   **Closed Circuits**: Every component must be part of a complete electrical path (no open ends). All pins must be connected.
-   **Neatness**: Align components to a 20px grid, maintain 200px spacing, and minimize overlapping wires/components.
-   **Feedback Loops**: Minimize trace length for stability.

## References
- `references/standard_values.md`: E-series resistor/capacitor tables.
- `references/topologies.md`: Common circuit templates (Filters, Amps).
- `assets/component_symbols.json`: Mapping of types to their visual/electrical metadata.

## Tools
- `add_component()`
- `connect_components()`
- `update_component()`
