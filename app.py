from flask import Flask, request, render_template, jsonify, url_for, redirect, session
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import create_engine, Column, String, Integer, Integer, text, func, insert, delete
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, scoped_session
from operator import itemgetter
import json
from werkzeug.security import check_password_hash, generate_password_hash
from datetime import timedelta

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///flashcards.db"
app.config.from_object(__name__)
# configure SQLALchemy
db = SQLAlchemy(app)
# configure secret key for encoding flask sessions:

app.secret_key = "Lkap5tWFJpW3Kx8VGZ0BlwREIBHBDPNr"
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"

# establish connection to database
engine = create_engine('sqlite:///flashcards.db', echo=True)
Base = declarative_base()

# Declare class for use as ORM for table 'Users':
class users(Base):
    __tablename__ = 'users'
    user_id = Column(Integer, primary_key=True)
    username = Column(String)
    h_password = Column(String)
    samples_used = Column(Integer)
    def __init__(self, username, h_password, samples_used):
        self.username = username
        self.password = h_password
        self.samples_used = samples_used

# Declare class for use as ORM for table 'cards':
class cards(Base):
    __tablename__ = 'cards'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer)
    category = Column(String)
    question = Column(String)
    answer = Column(String)
    important = Column(Integer)
    def __init__(self, user_id, category, question, answer, important):
        self.user_id = user_id
        self.category = category
        self.question = question
        self.answer = answer
        self.important = important

# Allow SQLAlchemy to generate any non-existent tables:
Base.metadata.create_all(engine)
# scope session to allow support for multiple threads:
SQLsession = scoped_session(sessionmaker(bind=engine))

# redirect index
@app.route('/')
def index():
    return redirect("/login")

# webpage for inputting new cards:
@app.route('/add_card', methods=['GET', 'POST'])
def add_card():

    # render web page from GET request:
    if request.method == "GET":
        if "user_id" in session:
            user_id = session["user_id"]
            categories = SQLsession.query(cards.category).filter(cards.user_id == user_id).group_by(cards.category).all()
            query = SQLsession.query(users.samples_used).filter(users.user_id == user_id).all()
            starter = False
            if query[0][0] == None:
                starter = True
            return render_template("add_card.html", categories=categories, starter=starter)
        else:
            return redirect("/login")

    # add new cards to db via 'POST' request: 
    else:
        # assign data from JSON (and flask session):
        data = request.get_json()
        user_id = session["user_id"]
        typed = data['typed']
        select = data['select']
        question = data['question']
        answer = data['answer']

        if select == "add starter deck":
            # check if this user has already added the starter deck before:
            query = SQLsession.query(users.samples_used).filter(users.user_id == user_id).all()
            if query[0][0] != None:
                return redirect("/flash_c")
            SQLsession.query(users).filter(users.user_id == user_id).update({users.samples_used: 1})
            SQLsession.commit()
            # import the starter deck and gift it to the account
            from static.starter_deck import starter_deck
            for card in starter_deck:
                new_card = cards(user_id, card["category"], card["question"], card["answer"], 0)
                SQLsession.add(new_card)
            # mark the account as having added the starter deck
            SQLsession.commit()
            return {
                "message": "Starter deck added!",
                "category": None
                    }
        # restrict length of user input
        if len(typed) > 25:
            return {
                "message": "Category name must be 25 charecters or fewer.",
                "category": None
                    }
        if len(question) > 300:
            return {
                "message": "Question must be 250 charecters or fewer.",
                "category": None
                    }
        if len(answer) > 400:
            return {
                "message": "Answer must be 250 charecters or fewer.",
                "category": None
                    }
        # check for attempt to enter new category
        if select == "typed":
            if typed == "." or typed == "all" or typed == "typed" or typed == "add starter deck" :
                return {
                    "message": "Error: an invalid category name was used. Please try again with a different category name.",
                    "category": None
                    }
            else:
                # check that the typed category does not already exist in the database, for that user:
                categories = SQLsession.query(cards.category).filter(cards.user_id==user_id).group_by(cards.category).all()
                cat_arr = []
                for tuple in categories:
                    cat = tuple[0]
                    cat_arr.append(cat)
                if typed in cat_arr:
                    return {
                        "message": "That category already exists! Select it from the dropdown and try again.",
                        "category": None
                    }
                # add new card with category "typed category", specific to user_id
                else:                                 
                    category=typed
                    stmt = insert(cards).values(user_id=user_id,  question=question, answer=answer, category=category, important=0)
                    engine.execute(stmt)
                    return {
                        "message": 'You created a new category "{category}". You added a new card to this category.'.format(category=category),
                        "category": None
                        }
        # handle attempts to add to pre-existing categories:
        else:
            category = select
            if category == "all":
                return {
                    "category": None,
                    "message": "Choose a valid category from the dropdown menu."
                }
            elif category and question and answer:
                # add the new card to the database
                stmt = insert(cards).values(user_id=user_id, question=question, answer=answer, category=category, important=0)
                engine.execute(stmt)
                return {
                    "category": category,
                    "message": None}
            else:
                return {
                    "category": None,
                    "message": "Ensure you fill all fields before submitting your card."
                }

@app.route('/flash_c', methods=['GET', 'POST'])
def flash_c():

    # a function which converts SQLAlchemy query into an array of dictionaries
    # where each dictionary represents a flashcard
    def make_list_of_cards(query):
        keys = ["question", "answer", "id"]
        card_list = []
        for card in query:
            temp_card = {}
            for i, val in enumerate(card):
                temp_card[keys[i]] = val
            card_list.append(temp_card)
        return card_list

    # a function which makes card queries and returns a list of dictionaries
    # i.e. returns a card_list
    def card_query(user_id, category, important):
        # when a user requests all categories (usually initial page load)
        if category == 'all':
            query = SQLsession.query(cards.question, cards.answer, cards.id).filter(cards.user_id == user_id, cards.important == important).all()
            return make_list_of_cards(query)
        else:
            query = SQLsession.query(cards.question, cards.answer, cards.id).filter(cards.category == category, cards.user_id == user_id, cards.important == important).all()
            return make_list_of_cards(query)

    # Handle Ajax requests once the page has loaded:
    if request.method == "POST":
        # raw data received from the AJAX request:
        data = request.get_json()
        
        category = data['category']
        important = data['important']
        del_id = data['delete']
        imp_id = data['imp_id']
        # find user from flask session:
        user_id =session["user_id"]
        # The following processes the initial page load request:
        if category == "all" and del_id == "." and imp_id == ".":
            return card_query(user_id, category, important)
        # the following processes a change of category:
        elif del_id == "." and imp_id == ".":
            return card_query(user_id, category, important)
        # the following processes a card deletion request:
        elif del_id != ".":
            stmt = f"DELETE FROM cards WHERE cards.id = {del_id} AND cards.user_id = {user_id}"
            engine.execute(stmt)
            # re-render a new list of cards:
            return card_query(user_id, category, important)
        # The following processes a request to mark a card as (un)important:
        else:
            # check if the card is already marked as important:
            count = SQLsession.query(cards.id).filter(cards.id == imp_id, important == 1).count()
            if count == 0:
                # mark the card as important:
                stmt = f"UPDATE cards SET important = 1 WHERE cards.id = {imp_id} AND cards.user_id = {user_id}"
                engine.execute(stmt)
            else:
                # mark the card as unimportant:
                stmt = f"UPDATE cards SET important = 0 WHERE cards.id = {imp_id} AND cards.user_id = {user_id}"
                engine.execute(stmt)
            return card_query(user_id, category, important)
    
    else:               # 'GET'
        if "user_id" in session:
            user_id = session["user_id"]
            # Find the categories available for the dropdown menu, for use in template:
            length = SQLsession.query(cards.question, cards.answer, cards.id).filter(cards.user_id == user_id).count()
            categories = SQLsession.query(cards.category).filter(cards.user_id == user_id).group_by(cards.category).all()
            return render_template("flash_c.html", length=length, categories=categories)
        else:
            return redirect("/login")
    
# function for use later
# Accepts a SQLalchemy user query and returns a list of dictionaries, 
# each dictonary representing a user
def make_user_list(query):
    keys = ["user_id", "username", "h_password"]
    user_list = []
    for user in query:
        user_dict = {}
        for i, val in enumerate(user):
            user_dict[keys[i]] = val
        user_list.append(user_dict)
    return user_list

@app.route("/login", methods=["GET", "POST"])
def login():

    # User reached route via POST (as by submitting a form via POST)
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        # Forget previous user
        session.clear()
        # Assign variables:
        is_correct_password = False
        # Check user mistakes:
        if not username:
            return render_template("login.html", message="You must provide a username")
        elif not password:
            return render_template("login.html", message="You must provide a password")
        # check for forbidden charecters and reject:
        elif ";" in username or ";" in password:
            return render_template("login.html", message="This charecter is forbidden ';'")
        elif "'" in username or "'" in password:
            return render_template("login.html", message="This charecter is forbidden ' ")

        # Query database for username and convert to useful format
        query = SQLsession.query(users.user_id, users.username, users.h_password).filter(users.username == username).all()
        user_list = make_user_list(query)

        # check password against hash:
        if len(user_list) == 1:
            is_correct_password = check_password_hash(user_list[0].get('h_password'), password)
        else:
            return render_template("login.html", message="Invalid username or password")

        # Confirm password and remember that user has logged in:
        if is_correct_password:
            user_id = user_list[0].get('user_id')
            session["user_id"] = user_id
            return redirect("/add_card")
        else:
            return render_template("login.html", message="Invalid username or password")
    # GET request:
    else:
        return render_template("login.html")
    

@app.route("/logout", methods= ["GET", "POST"])
def logout():
    session.clear()
    return redirect("/login")

@app.route("/register", methods=["GET", "POST"])
def register():

    if request.method == "POST":
        # assign user's data to variables:
        username = request.form.get("username")
        password = request.form.get("password")
        confirmation = request.form.get("confirmation")
        
        # check user data makes sense:
        if not username or not password or not confirmation:
            return render_template("register.html", message="User must submit a username, password and confirmation." )
        elif password != confirmation:
            return render_template("register.html", message="Passwords do not match." )

        # check username does not already exist:
        query = SQLsession.query(users.user_id, users.username, users.h_password).filter(users.username == username).all()
        if len(query) > 0:
            return render_template("register.html", message="Please pick a different username. This one has been taken.")
        # All checks passed. Safe to register new account to the database:
        else:
            # hash the password:
            hash = generate_password_hash(password)
            # insert into users table of database:
            stmt = insert(users).values(username=username, h_password=hash)
            engine.execute(stmt)
            # find user_id
            query = SQLsession.query(users.user_id, users.username, users.h_password).filter(users.username == username).all()
            user_list = make_user_list(query)
            # redirect to login page
            return redirect("/login")
    else:   # if "GET":
        return render_template("register.html")

if __name__ == "__main__":
    db.create_all()
    # Enable debug mode:
    app.run(debug=True)
