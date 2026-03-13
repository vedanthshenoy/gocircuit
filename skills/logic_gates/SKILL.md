# Logic Gates Skill

This skill provides expert knowledge on digital logic gates, digital circuit design, and Boolean algebra.

## Core Logic Gates

### AND Gate
- **Symbol:** IEEE D-shape
- **Logic:** Outputs 1 only if all inputs are 1.
- **Truth Table:**
  | A | B | Y |
  |---|---|---|
  | 0 | 0 | 0 |
  | 0 | 1 | 0 |
  | 1 | 0 | 0 |
  | 1 | 1 | 1 |

### OR Gate
- **Symbol:** Curved shape
- **Logic:** Outputs 1 if at least one input is 1.
- **Truth Table:**
  | A | B | Y |
  |---|---|---|
  | 0 | 0 | 0 |
  | 0 | 1 | 1 |
  | 1 | 0 | 1 |
  | 1 | 1 | 1 |

### NAND Gate
- **Symbol:** AND with bubble
- **Logic:** Outputs 0 only if all inputs are 1. (Inverse of AND)
- **Truth Table:**
  | A | B | Y |
  |---|---|---|
  | 0 | 0 | 1 |
  | 0 | 1 | 1 |
  | 1 | 0 | 1 |
  | 1 | 1 | 0 |

### NOR Gate
- **Symbol:** OR with bubble
- **Logic:** Outputs 0 if at least one input is 1. (Inverse of OR)
- **Truth Table:**
  | A | B | Y |
  |---|---|---|
  | 0 | 0 | 1 |
  | 0 | 1 | 0 |
  | 1 | 0 | 0 |
  | 1 | 1 | 0 |

### XOR Gate (Exclusive OR)
- **Symbol:** OR with double curve at input
- **Logic:** Outputs 1 if exactly one input is 1.
- **Truth Table:**
  | A | B | Y |
  |---|---|---|
  | 0 | 0 | 0 |
  | 0 | 1 | 1 |
  | 1 | 0 | 1 |
  | 1 | 1 | 0 |

### XNOR Gate
- **Symbol:** XOR with bubble
- **Logic:** Outputs 1 if inputs are the same.
- **Truth Table:**
  | A | B | Y |
  |---|---|---|
  | 0 | 0 | 1 |
  | 0 | 1 | 0 |
  | 1 | 0 | 0 |
  | 1 | 1 | 1 |

### NOT Gate (Inverter)
- **Symbol:** Triangle with bubble
- **Logic:** Outputs the opposite of the input.
- **Truth Table:**
  | A | Y |
  |---|---|
  | 0 | 1 |
  | 1 | 0 |

### Buffer
- **Symbol:** Triangle
- **Logic:** Outputs the same as the input.
- **Truth Table:**
  | A | Y |
  |---|---|
  | 0 | 0 |
  | 1 | 1 |

## Digital Circuit Design
- **Boolean Algebra:** Use laws (De Morgan, Commutative, etc.) to simplify circuits.
- **Karnaugh Maps:** Technique for simplifying logic expressions.
- **Timing:** Consider propagation delays in complex circuits.
- **Levels:** Standard logic levels (e.g., 0V for '0', 5V for '1').
