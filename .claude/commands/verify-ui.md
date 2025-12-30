# verify-ui

Verify UI implementation matches requirements using Playwright MCP.

**Feature to verify:** $ARGUMENTS

## Steps

1. **Start the dev server:**
   ```bash
   npm run dev
   ```
   Wait for server to start on http://localhost:5173

2. **Use Playwright MCP to open browser:**
   - Say: "Open http://localhost:5173 in Playwright"
   - Claude Code will launch a visible browser window

3. **Navigate to the feature:**
   - Navigate to the specific route/feature: $ARGUMENTS
   - For example: "Navigate to /Encounter"

4. **Take screenshots of key states:**
   - **Initial state:** Take screenshot before any interaction
   - **After interaction:** Click/fill/interact, then screenshot
   - **Success state:** Complete workflow, screenshot final state
   - **Error state:** Trigger validation errors, screenshot error messages

5. **Compare with design mockups (if available):**
   - Review screenshots against design specifications
   - Check for visual discrepancies

6. **Verify visual appearance:**
   - ✅ Colors match Tundra CSS design system
   - ✅ Spacing is consistent (padding, margins, gaps)
   - ✅ Typography is correct (font sizes, weights, line heights)
   - ✅ Borders and shadows match design
   - ✅ Icons and images display correctly

7. **Check responsive behavior:**
   - Resize browser window to mobile viewport
   - Verify layout adapts correctly
   - Check for text overflow or cut-off content

8. **Verify accessibility:**
   - Check for ARIA labels on interactive elements
   - Verify semantic HTML (headings, buttons, links)
   - Ensure keyboard navigation works
   - Check color contrast for text

9. **Test interactive elements:**
   - Click all buttons and verify behavior
   - Fill forms and check validation
   - Test hover and focus states
   - Verify loading spinners appear when expected

10. **Document findings:**
    - List any visual discrepancies
    - Note accessibility issues
    - Report bugs or missing features
    - Create GitHub issues if needed

## Visual Verification Checklist

**Layout & Spacing:**
- [ ] Margins and padding are consistent
- [ ] Grid/flex layouts align properly
- [ ] No overlapping elements
- [ ] Whitespace matches design

**Typography:**
- [ ] Font families are correct
- [ ] Font sizes match design (use Tundra CSS utilities)
- [ ] Line heights are readable
- [ ] Text colors have sufficient contrast

**Colors:**
- [ ] Brand colors match design system
- [ ] Background colors are correct
- [ ] Button colors match Tundra CSS theme
- [ ] Error/success states use appropriate colors

**Interactive Elements:**
- [ ] Buttons have hover/active states
- [ ] Form inputs show focus states
- [ ] Links are visually distinct
- [ ] Loading states are indicated

**Responsiveness:**
- [ ] Layout adapts to mobile (< 640px)
- [ ] Layout works on tablet (640px - 1024px)
- [ ] Layout works on desktop (> 1024px)
- [ ] No horizontal scrolling on mobile

**Accessibility:**
- [ ] Buttons have aria-label or text
- [ ] Form inputs have labels
- [ ] Icons have aria-hidden or aria-label
- [ ] Keyboard navigation works
- [ ] Focus indicators are visible

## Example Workflow

```
1. User: "verify-ui the encounter creation form"

2. Claude Code Response:
   - Starts dev server (if not running)
   - Opens http://localhost:5173 in Playwright
   - Navigates to /Encounter
   - Clicks "Create Encounter" button
   - Takes screenshot of empty form
   - Fills in form fields
   - Takes screenshot of filled form
   - Clicks submit
   - Takes screenshot of success state
   - Reviews all screenshots
   - Reports findings:
     * Form layout matches design ✅
     * Submit button color needs adjustment ⚠️
     * Missing validation message for required fields ❌
```

## Playwright MCP Commands

Use natural language to interact with the browser:
- "Open http://localhost:5173"
- "Click the button with text 'Create'"
- "Fill in the input named 'patientId' with 'patient-123'"
- "Take a screenshot"
- "Navigate to /Encounter"
- "Verify the heading says 'Encounter List'"

## Common Issues to Check

- **Missing loading states:** Buttons/forms don't show loading during API calls
- **Validation errors:** Error messages don't appear or are not visible
- **Layout breaks:** Content overflows or breaks at certain viewport sizes
- **Color contrast:** Text is hard to read against background
- **Missing feedback:** No confirmation after successful actions
- **Accessibility:** No keyboard focus indicators or ARIA labels
