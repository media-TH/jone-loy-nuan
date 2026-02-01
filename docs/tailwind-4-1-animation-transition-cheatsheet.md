# Tailwind 4.1 Animation + Transition Cheat Sheet

> Focused reference for core utilities, arbitrary values, patterns (stagger, enter/leave), and best practices. Links: transition behavior, duration, timing, delay, animation.

## Quick Reference
- Transition enablement
  - `transition` (sane defaults), `transition-none`, `transition-all`
  - `transition-colors`, `transition-opacity`, `transition-shadow`, `transition-transform`
  - Arbitrary: `transition-[height]`, `transition-[background-size]`
- Duration
  - `duration-75 100 150 200 300 500 700 1000`
  - Arbitrary: `duration-[350ms]`
- Timing function
  - `ease-linear`, `ease-in`, `ease-out`, `ease-in-out`
  - Arbitrary: `ease-[cubic-bezier(0.22,1,0.36,1)]`, `ease-[steps(4,end)]`
- Delay
  - `delay-75 100 150 200 300 500 700 1000`
  - Arbitrary: `delay-[450ms]`
- Animation
  - Built-ins: `animate-spin`, `animate-ping`, `animate-pulse`, `animate-bounce`, `animate-none`
  - Arbitrary: `animate-[<name>_<duration>_<timing>_<fill>_<repeat>]`
    - Example: `animate-[fade-in-up_600ms_ease-out_both]`

## Transition Behavior (prefers-reduced-motion)
- Respect users with reduced motion preferences
  - Disable transitions: `motion-reduce:transition-none`
  - Disable animations: `motion-reduce:animate-none`
- Prefer transform/opacity transitions for better performance.

## Common Transition Patterns
- Buttons/links hover
  - `transition-colors duration-200 ease-out hover:bg-muted`  
- Panels/content reveal (height)
  - Use transform/opacity if possible; if height is needed:  
    - Container: `overflow-hidden`  
    - Content: `transition-[height] duration-300 ease-out`
- Icon rotate on toggle
  - `transition-transform duration-200 data-[state=open]:rotate-180`
- Focus ring smoothness
  - `transition-shadow duration-150 focus:shadow-[0_0_0_3px_theme(colors.ring/50)]`

## Custom Keyframes (in CSS)
Define once in CSS (e.g., `app/globals.css`) and reference with `animate-[...]`.

```css
@keyframes fade-in-up {
  0% { opacity: 0; transform: translateY(12px) scale(0.98); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
```

Usage examples:
- Single element: `opacity-0 animate-[fade-in-up_600ms_ease-out_both]`  
- Reduced motion guard: `motion-reduce:animate-none`

## Staggered Entrances (no JS)
- Manual stagger per item
  - Add increasing delays:  
    - `opacity-0 animate-[fade-in-up_600ms_ease-out_both] [animation-delay:0ms]`  
    - `opacity-0 animate-[fade-in-up_600ms_ease-out_both] [animation-delay:120ms]`  
    - `opacity-0 animate-[fade-in-up_600ms_ease-out_both] [animation-delay:240ms]`
- CSS variable index pattern
  - Parent: `[*]:opacity-0 [*]:animate-[fade-in-up_600ms_ease-out_both] [*]:motion-reduce:animate-none [--stagger:120ms]`  
  - Children: set index per item: `[--i:0]`, `[--i:1]`, `[--i:2]`  
  - Children delay: `[animation-delay:calc(var(--i)*var(--stagger))]`
- Tips
  - Pair with `opacity-0` to avoid flash before animation begins.
  - Use `both` fill mode in your `animate-[...]` so end state persists.

## Enter / Leave (state-driven)
- Data attributes
  - Container: `data-[open=true]:opacity-100 data-[open=false]:opacity-0 transition-opacity duration-200`
- Group hover/focus
  - Parent: `group`  
  - Child: `opacity-0 transition-opacity duration-200 group-hover:opacity-100`
- Peer state
  - `peer aria-expanded` etc.: `peer-aria-expanded:rotate-180 transition-transform`
- Disclosure example
  - Trigger icon: `transition-transform duration-200 data-[state=open]:rotate-180`
  - Panel: `overflow-hidden transition-[height] duration-300 ease-out`

## Animation Recipes
- Fade up on mount
  - `opacity-0 animate-[fade-in-up_600ms_ease-out_both] motion-reduce:animate-none`
- Skeleton shimmer (pulse)
  - `animate-pulse bg-muted`
- Spinner
  - `border-2 border-muted-foreground/20 border-t-foreground rounded-full animate-spin`
- Attention bounce
  - `animate-bounce` (use sparingly; add `motion-reduce:animate-none`)

## Arbitrary Values Deep Dive
- Property: `transition-[filter]`, `transition-[max-height]`
- Duration: `duration-[450ms]`
- Easing: `ease-[cubic-bezier(0.22,1,0.36,1)]`
- Delay: `[transition-delay:180ms]`, `[animation-delay:220ms]`
- Will-change hint: `[will-change:transform]`

## Accessibility & Performance
- Always guard with `motion-reduce:animate-none` for non-essential motion.
- Animate opacity/transform; avoid animating layout (top/left/width/height) where possible.
- Keep durations snappy (150–350ms) for UI feedback; longer (400–700ms) for page-level entrances.
- Limit simultaneous animations to reduce jank on low-end devices.
- Quiz flow: keep Tailwind transitions to the standard duration set (150/200/300ms)
  and align with `lib/motion/quiz-motion.ts` tokens.

## Practical Examples
- Button
  - `transition-colors duration-200 ease-out hover:bg-primary hover:text-primary-foreground`
- Card hover lift
  - `transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg [will-change:transform]`
- Modal backdrop + panel
  - Backdrop: `opacity-0 data-[open=true]:opacity-100 transition-opacity duration-200`
  - Panel: `opacity-0 data-[open=true]:opacity-100 translate-y-4 data-[open=true]:translate-y-0 transition-all duration-200 ease-out`

## Debugging Checklist
- If animation doesn’t run: ensure element starts in a different state (e.g., `opacity-0`).
- Arbitrary `animate-[...]`: verify underscores `_` separate tokens and keyframe name matches CSS.
- Stagger: confirm delay units include `ms` and `both` fill mode applied.
- Reduced motion: verify `motion-reduce:animate-none` correctly disables.

---
Keep this sheet nearby while building. For full API details, see the Tailwind docs for transition behavior, duration, timing function, delay, and animation.

