# LexData Dynamic Redesign Safe Apply

This patch applies the uploaded `lexdata-dynamic-redesign (1).zip` homepage style.

It writes only:
- `app/page.tsx`
- `app/lexdata-theme.css`
- `components/motion.tsx`

It only edits `app/layout.tsx` to import the new CSS. It does not replace your navbar/auth/session/dashboard files.

The theme CSS hides the old global navbar only on the homepage using `body:has(.ld-page)`, so the dynamic homepage uses its own uploaded nav while other pages keep the original navbar.
