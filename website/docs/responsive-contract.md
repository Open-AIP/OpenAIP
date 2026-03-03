# Responsive Contract

## Supported Viewports

- The app must support these viewport targets: `360 x 800`, `390 x 844`, `768 x 1024`, `1024 x 768`, `1440 x 900`.
- The app must never horizontally scroll at `360px` width.
- `360px` is the strict minimum layout guardrail for manual verification.

## Breakpoints

- `base: 0px to 639px` - Single-column layout only. Main content must stack vertically. Sidebar must not remain fixed open and must use drawer or collapsed behavior. Tables must use internal horizontal scrolling or a mobile card/list presentation. Charts must shrink to container width.
- `sm: 640px` - Still mobile-first. Single-column remains the default. Minor spacing increases are allowed. Multi-column page shells must not be introduced unless content stays readable without overflow.
- `md: 768px` - Tablet breakpoint. Two-column supporting layouts may begin if content remains readable. Sidebar may become persistent only if primary content stays usable; otherwise it must stay collapsible. Navigation must remain fully reachable without clipping.
- `lg: 1024px` - Desktop layout begins. Standard sidebar plus main content layouts are allowed. Denser dashboard and table layouts may appear, but content must still wrap and remain contained within the page width.
- `xl: 1280px` - Expanded desktop. Increase readable line length and spacing, not fixed layout width. Additional columns may be used only when they improve scanability and do not introduce overflow.
- `2xl: 1536px` - Wide desktop. Content must stay centered and bounded with a max-width container. Charts and tables must not stretch so wide that readability degrades.

## Hard Rules

- The page must never horizontally scroll at `360px` width.
- Main page containers must never use fixed layout widths.
- Main page containers must never use `w-screen` for layout.
- Main page containers must never rely on fixed pixel widths that can exceed the viewport.
- Pages must use one consistent wrapper pattern: a full-width outer wrapper, an inner content wrapper centered with `w-full`, responsive horizontal padding, and a bounded max width, and content sections sized to the wrapper instead of the viewport.
- This document defines the wrapper pattern only. It must not be treated as an implementation change.
- Tables must never cause page-level overflow.
- Tables must either use internal `overflow-x-auto` or switch to a mobile card/list representation.
- Charts must scale to their parent container.
- Charts must never hardcode a width larger than the parent container.
- Sidebar navigation must become a drawer or clearly collapsible below `md`.
- Absolutely positioned decorative or utility elements must remain clipped or contained inside the viewport.
- Long text values must wrap, truncate, or scroll locally. They must never force page overflow.

## Common Overflow Offenders

- `w-screen` - Can ignore parent padding and create overflow.
- `min-w-*` - Can force children wider than the viewport.
- Absolutely positioned elements - Can escape container bounds.
- Long unbroken strings - Can expand cards or tables unless wrapped or clipped.
- Large legends - Can push chart containers wider than intended.

## Manual Viewport Test Routine

- Test these viewport sizes every time: `360 x 800`, `390 x 844`, `768 x 1024`, `1024 x 768`, `1440 x 900`.
- At each viewport, verify: no horizontal page overflow.
- At each viewport, verify: primary navigation is reachable and usable.
- At each viewport, verify: sidebar behavior matches the breakpoint rule.
- At each viewport, verify: charts stay inside their card or parent container.
- At each viewport, verify: tables remain readable and do not push the page wider.
- At each viewport, verify: key page content remains visible without clipped actions or text.
- Step 1: Open the target page in browser devtools responsive mode.
- Step 2: Set the viewport to one of the required sizes.
- Step 3: Scroll top-to-bottom and left-to-right once.
- Step 4: Confirm there is no page-level horizontal scroll.
- Step 5: Check navigation, charts, and tables.
- Step 6: Repeat for the next viewport.

## Edge Cases To Always Test

- Long barangay names must be checked for wrapping, truncation where appropriate, local containment, and no page-level overflow.
- Long AIP titles must be checked for wrapping, truncation where appropriate, local containment, and no page-level overflow.
- Very large currency values must be checked for wrapping, truncation where appropriate, local containment, and no page-level overflow.
- Long chat strings with no spaces must be checked for wrapping, truncation where appropriate, local containment, and no page-level overflow.

## Rollback

- Phase 1 rollback is safe because it is documentation-only.
- To revert Phase 1, delete `website/docs/responsive-contract.md`.
- No runtime behavior, build output, or production functionality is affected.
