---
name: search_transparency
description: Principles for communicating search capabilities in UI and AI interactions.
---

# Search Transparency Skill

## Principle
Users should never have to guess what data is being queried. Semantic and keyword search interfaces must explicitly state the searchable attributes to improve discoverability and expectation management.

## UI Requirements

### 1. Specific Placeholders
Avoid generic "Search...", "Find items...", or "Describe what you lost..." placeholders. Use specific, comma-separated lists of searchable fields.

**Bad:**
- `placeholder="Search items..."`
- `placeholder="Search..."`

**Good:**
- `placeholder="Search by name, category, or location..."`
- `placeholder="Describe item color, brand, or location..."` (for semantic search)

### 2. Status Indicators
When switching between search modes (e.g., Keyword vs. AI/Semantic), the placeholder should update to reflect the different search logic (e.g., "Search tags..." vs. "Describe the item...").

## AI Interaction Rules
When the USER asks about search, or when implementing new search features, the ASSISTANT must:
1. Enumerate the exact fields included in the search index (e.g., `nameTag`, `description`, `location`, `category`).
2. Clearly distinguish between keyword (substring match) and semantic (embedding-based) search capabilities.
3. Suggest UI improvements that follow the "explicit placeholder" rule.
