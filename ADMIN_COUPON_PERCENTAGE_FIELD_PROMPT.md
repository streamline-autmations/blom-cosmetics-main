# 🎯 Admin Interface: Add Percentage Discount Field

## Issue Found
The admin interface is missing the percentage amount field when creating/editing coupons. Users need to be able to set percentage discount values (e.g., 10%, 20%, 25%, etc.).

## Prompt for Admin Developer

### Required Changes to Admin Interface

**TASK**: Add percentage discount field to coupon creation and editing forms in the admin interface.

### What Needs to Be Added

1. **Form Field for Percentage Input**
   - Label: "Discount Percentage" or "% Amount"
   - Input type: Number with % suffix
   - Range: 1-100
   - Validation: Only allow numbers 1-100
   - Placeholder: "20" (for 20% discount)

2. **Form Logic Updates**
   - When discount type is "percentage", show percentage field
   - When discount type is "fixed", hide percentage field
   - Form should dynamically switch between fields based on type selection

3. **Database Integration**
   - Field should map to `coupons.percent` column in database
   - Save percentage as integer (e.g., 20 for 20%)
   - Display percentage with % symbol in admin interface

### Complete Form Structure Needed

```html
<!-- Discount Type Selection -->
<select name="type" id="discountType">
  <option value="fixed">Fixed Amount (R)</option>
  <option value="percent">Percentage (%)</option>
</select>

<!-- Fixed Amount Field (for 'fixed' type) -->
<div id="fixedField" class="discount-field">
  <label for="value">Discount Amount (Rands)</label>
  <input type="number" name="value" id="value" placeholder="250" step="0.01">
</div>

<!-- Percentage Field (for 'percent' type) -->
<div id="percentField" class="discount-field" style="display: none;">
  <label for="percent">Discount Percentage (%)</label>
  <input type="number" name="percent" id="percent" placeholder="20" min="1" max="100">
</div>
```

### JavaScript Logic Needed

```javascript
// Show/hide fields based on discount type
document.getElementById('discountType').addEventListener('change', function() {
  const type = this.value;
  const fixedField = document.getElementById('fixedField');
  const percentField = document.getElementById('percentField');
  
  if (type === 'fixed') {
    fixedField.style.display = 'block';
    percentField.style.display = 'none';
  } else if (type === 'percent') {
    fixedField.style.display = 'none';
    percentField.style.display = 'block';
  }
});
```

### CSS Styling Suggestions

```css
.discount-field {
  margin-bottom: 1rem;
}

.discount-field label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.discount-field input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.discount-field input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
}
```

### Validation Rules

- **Percentage field validation**:
  - Only numbers 1-100 allowed
  - Required when discount type is "percent"
  - Show error: "Please enter a percentage between 1 and 100"

- **Fixed amount field validation**:
  - Only positive numbers allowed
  - Required when discount type is "fixed"  
  - Show error: "Please enter a valid discount amount"

### Current Database Schema Reference

The coupons table has these relevant fields:
- `type` - 'fixed' or 'percent'
- `value` - For fixed discounts (amount in Rands)
- `percent` - For percentage discounts (1-100)
- `max_discount_cents` - Optional cap on percentage discounts

### Test Cases to Implement

1. **Create Fixed Discount**:
   - Select "Fixed Amount"
   - Enter 250 → Should save as R250 discount

2. **Create Percentage Discount**:
   - Select "Percentage"  
   - Enter 20 → Should save as 20% discount

3. **Edit Existing Coupon**:
   - Load coupon with percent=15
   - Form should show "Percentage" selected and 15 in percentage field

### Expected Outcome

After implementing these changes, admin users should be able to:
1. Create percentage-based coupons (10%, 20%, etc.)
2. Edit existing percentage coupons
3. Switch between fixed and percentage discount types
4. See proper validation and error messages

### Implementation Priority

**HIGH PRIORITY** - This is blocking users from creating percentage discount coupons in the admin interface.

### Files Likely to Need Updates

- Coupon creation form component
- Coupon editing form component  
- Coupon validation logic
- Form submission handlers
- CSS styling files
- JavaScript form interaction scripts

### Additional Notes

- Ensure the form works on both desktop and mobile interfaces
- Add help text: "Percentage discounts recalculate automatically when cart total changes"
- Consider adding a preview of the discount calculation
- Test with actual coupon codes to ensure database integration works