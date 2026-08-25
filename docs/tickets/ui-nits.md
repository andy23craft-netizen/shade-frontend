# UI Feedback

* I don't like the images in the right empty space (i.e., the stamp, the glasses, etc.)
  * I don't mind the pen on the `/collection/manage` page, but that's the only one
  * My window wasn't wide enought oshow the whole image, and then the image resized as I made my window wider
  * The image doesn't scroll with the content, which is odd
* Either the `wishlist-card` or `the wishlists-list__item` on the `/wishlists` page is crooked by just a little bit. This is crazy. The content should be vertically straight
* The `/collection/manage` page has a link to Deleted Books. But in the Shelves sub-page, there's also a shelf for the Missing books. Why is this in both places?
  * The "Deleted Books" button on the `/collection/manage` page may be obsolete.
* Currently, on many pages, if the scanner scans a book in the library, the user will be taken straight to that book's details page to either check it in or out. If the user uses the scanner to scan an ISBN that is NOT in the library, then the user shouldbe taken to the Add a Book page with the infor already filled out.
  * This functionality may make the "Add a Book" button on the `/collection/manage` page obsolete
* It may improve the user experience to remove the `/collection/manage` page, and simply have a "Shelves" button in the top nav "Collection" sub-menu
* Many pages have an "Add a ___" card at the top before listing all the existing items. This is not a great UI.
  * Let's move all the "Add a ___" to a modal popup that appears when the user presses a "+" button. Maybe that "+" button can appear as an index card sticking up from the bottom-right of the page. This button should stay at the bottom of the window as the user scrolls up and down.
    * `/shelves`, `/wishlists`, and `/collections`
* The `/books?shelf_name=a2` page and the `/books` page have the same controls at the top of the page before the table of content. This top content takes up too much vertical space.
  * I don't like the "Select Books" toggle button
  * We should have a single text field that tries authors first and then titles second.
  * The two sort controls should be much less wide. Also, they should simply be buttons with three states: Asc, Desc, or None.
  * The Read Status filter should be a simple checkbox, not a dropdown.
  * The Categories filter shouldbe re-thought
  * I think all controls should live on a single row above the table on the desktop, and should be collapsed on mobile
* The dashboard page does not need a refresh button. The browser already has this functionality.
* On the dashboard page, the background image for `section class="route-page dashboard-page"` has been enlarged too much for its low resolution. Find a higher resolution image for this.
