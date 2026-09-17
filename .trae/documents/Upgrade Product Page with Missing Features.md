I have analyzed your request, screenshots, and the codebase. I can recreate that clean, professional, mobile-first design for you.

Here is the plan to upgrade your **Product Detail Page**:

1.  **Visual Overhaul (Match Screenshots)**:
    *   **Layout**: Split into Image Gallery (Left) and Product Info (Right) on desktop; Stacked on mobile.
    *   **Product Info**: Title, Price, Stock Status, Quantity Selector.
    *   **Buttons**: Add the missing **"Buy Now"** button (White with black border) next to the Pink "Add to Cart" button.
    *   **Accordion Sections**: Instead of simple tabs, I will implement the collapsible "Overview", "Features & Benefits", "How to Use", "Ingredients", and "Product Details" sections exactly like your screenshot. This is much better for mobile.

2.  **Smart Content Loading (Supabase)**:
    *   I will connect all the specific fields you mentioned: `Ingredients` (INCI vs Key), `Product Details` (Size, Shelf Life, Claims).
    *   **Hide Empty Sections**: I will add logic to **automatically hide** any section (like "How to Use" or "Ingredients") if that specific product doesn't have that information in Supabase. No more empty boxes!

3.  **Reviews System**:
    *   I will verify the "Write a Review" button works.
    *   The code currently points to a Netlify function (`/.netlify/functions/reviews-intake`) for submitting reviews (which handles the webhook). I will keep this so your email/n8n automation continues to work when deployed.

4.  **"You Might Also Like"**:
    *   I will add a recommendations section at the bottom.

I will modify `src/pages/ProductDetailPage.tsx` to implement this. I don't need to delete everything; I will replace the current layout with this improved version.

**Shall I proceed with these changes?**