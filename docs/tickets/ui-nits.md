# UI Feedback

* The `/books?shelf_name=a2` page and the `/books` page have the same controls at the top of the page before the table of content. This top content takes up too much vertical space.
  * I don't like the "Select Books" toggle button
  * We should have a single text field that tries authors first and then titles second.
  * The two sort controls should be much less wide. Also, they should simply be buttons with three states: Asc, Desc, or None.
  * The Read Status filter should be a simple checkbox, not a dropdown.
  * The Categories filter shouldbe re-thought
  * I think all controls should live on a single row above the table on the desktop, and should be collapsed on mobile
		- Halfway through this step.

* The dashboard page does not need a refresh button. The browser already has this functionality.
* On the dashboard page, the background image for `section class="route-page dashboard-page"` has been enlarged too much for its low resolution. Find a higher resolution image for this.
* "Shade Library" in the footer is adding no value. Consider a "last-updated" date instead, maybe
