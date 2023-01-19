# Quick demo guide:
- A pre-build exists with all dependencies needed for this project, so creating a bug-free codespace in the cloud is will take less than a minute:
    - Sign into Github
    - Click the green "code" button on the home page of this repo
    - Click 'codespaces'
    - Click the plus symbol to setup a new codespace. It will automatically be setup with the pre-build configuration I have created.
- Once the code space has launched, run the command "flask run" in the terminal.
- register an account within the web app once it has launched (This does not require any personal details or email address)
- Once logged in, click the red button to "add a starter deck" when you arrive on the "add_card" page
- Play around with the functionality of the main flash card page and add card page

## Dependencies:
Python 3.11 (included in codespace)
flask (requires "pip install flask")
flask_sqlalchemy (requires "pip install flask_sqlalchemy")

Other dependencies for this project do not require install. They include jQuery 3.6.0, bootstrap 3.4.1 and a modified version of a toggle switch taken from: [w3schools](https://www.w3schools.com/howto/howto_css_switch.asp).

## Description:

This project is a web application which allows users to create unique accounts, from which they can create, categorise and delete flashcards. The project makes use of flask and javascripts "fetch" api to keep the project as fast and lightweight as possible.

The main file "app.py" defines the behaviour for each route and webpage. All html templates extend the base template "layout.html". The register (register.html, register.js) and login (login.html, register.js) pages are somewhat self explanatory, and include error messages and conditions to protect against clumsy/malicious users. The user account system allows cards to be created, destroyed and re-categorised without affecting other people's work.

"/flash_c" (flash_c.html, flash_c.js, app.py, index.css) is the main webpage of the project, and utlises a significant proportion of the project's code. The HTML template renders dynamically, based on how many flashcards are in a users account. The Javascript code is responsible for filtering and re-rendering cards as they are manipulated by the user. Users can filter their cards based on subject category and/or priority simultaneously. Requests to delete and change the priority of specifc cards are handled by javascript's fetch api.

"/add_card" (add_card.html, add_card.js, app.py, index.css) is a webpage which allows users to add cards to their account. This page also makes use of AJAX, allowing cards to be added quickly, while viewing a responsive log of what the back-end is doing. "starter_deck.py" holds an array of flashcards which can be easily added by new users.
