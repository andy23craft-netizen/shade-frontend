# FEAT-06 -- Album visual identity and crate language

**Status:** Ready to implement in bounded surface slices.

**Dependency group:** Media and hosted-library visual identity.

**Depends on:** Shared visual-quality and media-navigation work derived from PLAN-03. A
complete up-front visual brief or asset inventory is not required.

## Objective

Give Albums a cohesive record-store/listening-room identity within the shared Shade
application and consistently use **crate** as the album location noun.

## Acceptance criteria

- [ ] User-facing album placement language uses **crate** while API transport continues to
      use the shared shelf/location resource and `shelf_name`.
- [ ] Album routes use a coherent visual system informed by
      `UI_DESIGN_NOTES.ALBUM_ANALOGIES.md`: sleeve proportions, record-crate/divider cues,
      walnut hi-fi furniture, speaker cloth, brass controls, shop cards, liner notes, warm
      stage light, and restrained neon as appropriate to each surface.
- [ ] The result feels distinct from Books without changing shared information architecture,
      administrative control names, or interaction semantics.
- [ ] Each bounded surface ticket records the references, art direction, and assets selected
      for that surface; no master asset-approval gate is introduced.
- [ ] Decorative assets meet the definitive performance guardrails, lazy-load when
      noncritical, and do not increase critical JavaScript solely for presentation.
- [ ] Keyboard, mobile, reduced-motion, contrast, text resizing, loading, empty, and error
      behavior remain equivalent to the shared application standard.
- [ ] Visual and accessibility regression coverage includes album browse, detail, forms,
      artwork, wishlist membership, loans, and Dashboard entry points as they are styled.

## Out of scope

Selectable skins, a free-form theme editor, spatial navigation, ambient audio, deep
weather/time simulation, and changes to the underlying location contract.
