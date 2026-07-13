# Department-Division Management UI Usage Guide

## Quick Start

### Access the Departments Page
1. Log in with admin account (Tamrat Assefa Weldemesekel)
2. Navigate to **Departments** from the sidebar
3. You'll see all departments displayed as expandable cards

---

## Department View

### Initial View
```
┌─────────────────────────────────────────────────────────────────┐
│ Departments                                  [+ Add Department]  │
│ Manage organization departments                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ➤ Finance                         FIN      Emma Davis   [⚙ 🗑]  │
│    Financial management                                          │
│                                                                  │
│  ➤ Legal                           LEG      Michael Brown [⚙ 🗑] │
│    Legal affairs                                                 │
│                                                                  │
│  ➤ Operations                      OPS      Sarah Johnson[⚙ 🗑] │
│    Operational management                                        │
│                                                                  │
│  ➤ Compliance & Risk               CRM      John Smith   [⚙ 🗑] │
│    Handles compliance and risk                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Expanding a Department

### Click on Department to Expand

```
┌─────────────────────────────────────────────────────────────────┐
│ Departments                                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ⬇ Finance                         FIN      Emma Davis   [⚙ 🗑] │
│    Financial management                                          │
│    ┌──────────────────────────────────────────────────────────┐ │
│    │ Divisions                          [+ Add Division]      │ │
│    │ Manage divisions for Finance                             │ │
│    ├──────────────────────────────────────────────────────────┤ │
│    │                                                          │ │
│    │ Name          │ Code │ Status  │ Head      │ Actions    │ │
│    ├──────────────────────────────────────────────────────────┤ │
│    │ Accounting    │ A    │ Active  │ —         │ [✎] [🗑]   │ │
│    │ Financial...  │ FP   │ Active  │ —         │ [✎] [🗑]   │ │
│    │ Treasury      │ TM   │ Active  │ —         │ [✎] [🗑]   │ │
│    │                                                          │ │
│    └──────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ➤ Legal                           LEG      Michael Brown [⚙ 🗑] │
│    Legal affairs                                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Adding a Division

### Step 1: Click "Add Division" Button

```
[+ Add Division]
```

### Step 2: Fill Division Form

```
┌─────────────────────────────────────────────┐
│           Add Division              [X]     │
├─────────────────────────────────────────────┤
│                                             │
│ Division Name *                             │
│ ┌───────────────────────────────────────┐   │
│ │ Digital Banking Services             │   │
│ └───────────────────────────────────────┘   │
│                                             │
│ Code *                                      │
│ ┌───────────────────────────────────────┐   │
│ │ DBS                                   │   │
│ └───────────────────────────────────────┘   │
│                                             │
│ Status                                      │
│ ┌───────────────────────────────────────┐   │
│ │ Active                            ▼   │   │
│ └───────────────────────────────────────┘   │
│                                             │
│ Description                                 │
│ ┌───────────────────────────────────────┐   │
│ │ Digital banking services for agents  │   │
│ │                                       │   │
│ └───────────────────────────────────────┘   │
│                                             │
│ Division Head                               │
│ ┌───────────────────────────────────────┐   │
│ │ Jane Smith                            │   │
│ └───────────────────────────────────────┘   │
│                                             │
│              [Cancel] [Add Division]        │
└─────────────────────────────────────────────┘
```

### Step 3: Success Notification

```
┌──────────────────────────────────────────┐
│ ✓ Division added successfully    [X]     │
└──────────────────────────────────────────┘
```

---

## Editing a Division

### Step 1: Click Edit Icon (✎)

The edit icon appears next to each division in the expanded department view.

### Step 2: Update Information

```
┌─────────────────────────────────────────────┐
│           Edit Division              [X]    │
├─────────────────────────────────────────────┤
│                                             │
│ Division Name *                             │
│ ┌───────────────────────────────────────┐   │
│ │ Digital Banking Services              │   │
│ └───────────────────────────────────────┘   │
│                                             │
│ Status                                      │
│ ┌───────────────────────────────────────┐   │
│ │ Active                            ▼   │   │
│ └───────────────────────────────────────┘   │
│                                             │
│  ... (other fields)                         │
│                                             │
│           [Cancel] [Update Division]        │
└─────────────────────────────────────────────┘
```

---

## Deleting a Division

### Step 1: Click Delete Icon (🗑)

### Step 2: Confirm Deletion

```
┌─────────────────────────────────────────┐
│ Are you sure you want to delete          │
│ "Digital Banking Services"?              │
│                                          │
│          [Cancel]  [Confirm]             │
└─────────────────────────────────────────┘
```

### Step 3: Success Message

```
┌──────────────────────────────────────────┐
│ ✓ Division deleted successfully  [X]     │
└──────────────────────────────────────────┘
```

---

## Features Explained

### Status Badges
- **Active** (Green): Division is active
- **Inactive** (Gray): Division is inactive

### Icons
- **⚙** (Gear): Edit department
- **🗑** (Trash): Delete department
- **✎** (Pencil): Edit division
- **➤** (Chevron Right): Expand department
- **⬇** (Chevron Down): Collapse department

### Actions
- **Expand/Collapse**: Click on department row to toggle divisions view
- **Add Division**: Only available when department is expanded
- **Edit Division**: Click pencil icon to open edit form
- **Delete Division**: Click trash icon (requires confirmation)

---

## Form Validation

### Required Fields
- **Division Name**: Must not be empty
- **Code**: Must not be empty, minimum 2 characters

### Validation Feedback
```
┌───────────────────────────────────┐
│ Division code is required    [X]  │
└───────────────────────────────────┘
```

### Auto-Corrections
- Code is automatically converted to uppercase
- All text fields are trimmed of whitespace

---

## Error Handling

### Permission Denied
```
┌──────────────────────────────────────────────┐
│ ✗ Forbidden: Insufficient permissions  [X]  │
└──────────────────────────────────────────────┘
```

### Not Found
```
┌──────────────────────────────────────────────┐
│ ✗ Department not found                 [X]  │
└──────────────────────────────────────────────┘
```

### Server Error
```
┌──────────────────────────────────────────────┐
│ ✗ Failed to add division               [X]  │
└──────────────────────────────────────────────┘
```

---

## Tips & Tricks

### Expanding Multiple Departments
You can expand one department at a time. Click on another department to automatically collapse the previous one and expand the new one.

### Quick Status Change
When editing a division, you can quickly change its status from active to inactive using the dropdown menu.

### Search (Future)
Future versions may include search functionality to filter departments by name.

### Bulk Operations (Future)
Future versions may support creating multiple divisions at once.

---

## Keyboard Shortcuts

- **Tab**: Navigate between form fields
- **Enter**: Submit form when focused on submit button
- **Escape**: Close modal (cancel any operation)

---

## Responsive Design

### Desktop View
- Full-width tables with all details visible
- Side-by-side layout for modals

### Tablet View
- Optimized card layout
- Touch-friendly buttons and icons

### Mobile View
- Stacked card layout
- Large touch targets for buttons
- Scrollable tables

---

## Performance Notes

### Loading States
- During form submission, the button shows "Adding..." or "Updating..."
- During data fetch, a loading spinner is displayed

### Real-time Updates
- Division list refreshes immediately after add/edit/delete
- No need to manually refresh the page

---

## Troubleshooting

### Division List Not Showing
1. Verify the department is expanded (click on it)
2. Check browser console for errors
3. Verify you have appropriate permissions

### Form Won't Submit
1. Check all required fields are filled
2. Verify code is at least 2 characters
3. Look for validation error messages

### Changes Not Saving
1. Check the success notification
2. Verify your internet connection
3. Check browser console for error details

---

## Related Features

### Department Management
- Add/Edit/Delete departments (top-level)
- Assign department heads
- View all divisions under each department

### Role Management
- Admin users can manage all divisions
- Permission: `documents:admin` required for modifications
- Permission: `documents:view` required for viewing

---

## Next Steps

1. **Explore the Hierarchy**: Click through departments to see all divisions
2. **Add New Division**: Try adding a division to an existing department
3. **Edit Information**: Modify division details and status
4. **Delete & Recreate**: Practice deleting and re-adding divisions

---

**Last Updated**: June 29, 2026  
**Version**: 1.0.0
