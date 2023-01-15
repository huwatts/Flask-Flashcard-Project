
#### Video Demo:  <URL HERE>

#### Description:

This project is a web application which allows users to create unique accounts, from which they can create, categorise and delete flashcards. It was decided that the speed and responsiveness of the application would be a priority. As a result, the lightweight python framework "flask" was chosen as the back-end for the website, while the front end would make liberal use of JavaScript's AJAX functionality, in the form of "fetch."  

SQLAlchemy was adopted early in the project to add an additional layer of security with respect to user logins, as user data is held and checked by a SQL database. This led to research on the concept of object relational mapping (ORM). In addition to security improvements, this makes the code for SQL queries more readable and made it easier to avoid mistakes during development.

The main file "app.py" defines the behaviour for each route and webpage. All html templates extend the base template "layout.html". The register (register.html, register.js) and login (login.html, register.js) pages are somewhat self explanatory, and include error messages and conditions to protect against clumsy/malicious users. The user account system allows cards to be created, destroyed and re-categorised without affecting other people's work.

"/flash_c" (flash_c.html, flash_c.js, app.py, index.css) is the main webpage of the project, and utlises a significant proportion of the project's code. The HTML template renders dynamically, based on how many flashcards are in a users account. The Javascript code is responsible for re-rendering cards as they are manipulated. The webpage allows users to delete flash cards or mark them as high priority. Users can filter their cards based on subject category and/or priority simultaneously. The design decision to add a priority feature was implemented to allow difficult and easy cards to be seperated. This was all implemented using AJAX as it was decided that any page refresh would be too disruptive to the user experience and a "commit" or "submit" button would be too user un-friendly. The syntax of jQuery 3.6 was researched and utilised to help deliver this functionality.

"/add_card" (add_card.html, add_card.js, app.py, index.css) is a webpage which allows users to add cards to their account. This page also makes use of AJAX. THis was implemented to ensure users could add multiple cards to the same category quickly. The page generates a log of cards added to the database, to keep it responsive and to prevent users from adding the same card multiple times. To help inspire new users, it was decided a starter deck could be added to accounts, provided they had not added this deck of cards before. This starter deck is held by "starter_deck.py" as a list of dictionaries, and covers multiple categories.

Other dependencies for this project include bootstrap 3.4.1 and a modified version of a toggle switch taken from: [w3schools](https://www.w3schools.com/howto/howto_css_switch.asp). 