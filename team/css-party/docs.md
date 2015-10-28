Console help
====

- I enter `help()` in the js console.
- I see instructions on how to get started.

Logging in
====

- I click the "login" button.
- A prompt appears and I enter a valid secret key.
- "login" button is replaced with "wb josh" and a "logout" button.

Logging out
====

- I click the "logout" button.
- "wb josh" and "logout" button are replaced with "login" button.
- I can no longer make changes to divs.

Making changes
====

- I am logged in and make some changes (with devtools) to my divs.
- Changes are broadcast to other users.

Storing images
====

- I set the background of a div with a base64 image.
- Before this change is broadcast to the other users, the image data is pushed to the server and stored.
- In the browser the URL is rewritten to point to the div's image endpoint.
