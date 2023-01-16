$(function() {
    const flash_class = $('.flash_card');
    const front_class = $('.face--front');
    const back_class = $('.face--back');

    // an array to keep track of flipped cards:
    let flipped = [];

    // cards_to_render stores the list of cards to be rendered on the page
    let cards_to_render = [];
    // all_cards stores all cards for the current user, and is generated by "fetch_request()"
    // this variables keeps track of the "toggle priority" button and is set to 0 by default.
    let important = 0;
    let category = "all"

    // fetch request upon intial page load
    let inital_entry = {
        "category": "all",
        "delete": ".",
        "imp_id" : "."
    }
    fetch_request(inital_entry)

    // event listener for the "important" checkbox
    $('#slider').on('change', function() {
        if ($(this).prop('checked')) {
            important = 1;
        } else {
            important = 0;
        };
        filter_cards(200);
        });
 
    // Event listener for change of category:
    $('select[name="category"]').on('change', function() {
        category = $(this).val();
        filter_cards(200);
    });

    // event listeners for 'flipped' array:
    flash_class.each(function(i) {
        $(this).on('click', function() {
            if (flipped[i]) {
                flipped[i] = false;
            } else {
                flipped[i] = true;
            }
        })
    })

    // sql database id of clicked card:
    let clicked_id
    // cards_to_render[i] of clicked card:
    let i_clicked

    // add event listener to the delete button
    $("#delete_card").on('click', function(event) {
        event.preventDefault();
        if (clicked_id) {
            // modify local copies of cards:
            all_cards.splice(i_clicked, 1);
            cards_to_render.splice(i_clicked, 1);
            // render modifications for user:
            render_cards(0)
            // inform back-end of modifications:
            entry = {
                "category": $('select[name="category"]').val(),
                "delete": clicked_id,
                "imp_id" : "."
            }
            // update_needed = false:
            fetch_request(entry, false);
        }
    });

    // add event listener to the "Toggle priority" button
    // This includes:
    // - an update to the local card dictionaries
    // - an update to the database on the server
    $("#imp").on('click', function(event) {
        event.preventDefault();
        if (clicked_id) {
            // modify local copies of cards:

            // find the index of the clicked card wrt the "all_cards" array: 
            const hasCorrectId = (element) => element.id == clicked_id;
            let index = all_cards.findIndex(hasCorrectId);
            // change the dictionary at the index to have the importance toggled:
            if (all_cards[index].important == 0) {
                all_cards[index].important = 1;
            } else {
                all_cards[index].important = 0;
            };
            // stop rendering the card with changed priority:
            cards_to_render.splice(i_clicked, 1);
            render_cards(0);
            // inform back-end of modifications:
            entry = {
                "category": $('select[name="category"]').val(),
                "delete": ".",
                "imp_id" : clicked_id
            }
            // update_needed = false:
            fetch_request(entry, false);
        } else {
            console.log("no clicked id found");
        }
    });

    function fetch_request(entry, update_needed=true) {
        // send the request to the backend:
        fetch(`${window.origin}/flash_c`, {
            method: "POST",
            credentials: "include",
            body: JSON.stringify(entry),
            cache: "no-cache",
            headers: new Headers({
                "content-type": "application/json"
            })
        })
        .then (function (response){
            // check for any request errors:
            if (response.status !== 200) {
                console.log("Response error: " + `${response.status}`);
                return;
            } else {
                response.json().then(function (data) {
                    if (update_needed) {
                        // update all_cards with the most recent clone from server-side
                        all_cards = data;
                        // update flipped array to be up to date with all_cards
                        flipped = []
                        for (let i = 0; i < all_cards.length; i++) {
                            flipped.push(false)
                        }
                        // create event listeners, now that the number of flashcard elements is known:
                        flash_class.each(function(i){
                            $(this).on('click', function() {
                                clicked_id = cards_to_render[i].id;
                                i_clicked = i;
                            });
                        });
                        // console.log(cards_to_render);
                        filter_cards(300);
                    } else if (data.success != true) {
                        console.log("Back-end failed to update modifications")
                    };
                })
            }
        })
    };

    // This function allows all_cards to be fitlered as per the user's request
    function filter_cards(animation_time=0) {
        // clear cards_to_render
        cards_to_render = []
        // use for loop to check category and append to updated filtered list "cards_to_render"
        if (category == "all") {
            for (let i = 0; i < all_cards.length; i++) {
                if (all_cards[i].important == important) {
                    cards_to_render.push(all_cards[i]);
                }}
        } else {
            for (let i = 0; i < all_cards.length; i++) {
                if ((all_cards[i].category == category) && (all_cards[i].important == important)) {
                    cards_to_render.push(all_cards[i]);
                }
            }
        }
        render_cards(animation_time)        
    }

    function render_cards(animation_time) {
        // hide and show entire flash card according to number of entries available:
        // fill front_class with new questions:
        reset_flips();
        front_class.each(function(i) {
            if (cards_to_render[i]){
                $(this).html(cards_to_render[i].question);
            }
        });
        // fill back_class with answers:
        back_class.each(function(i) {
            if (cards_to_render[i]){
                $(this).html(cards_to_render[i].answer)
            }
        });
        render_class(flash_class, animation_time);
        render_class(front_class, animation_time);
        render_class(back_class, animation_time);
    }  

    function render_class(div_class, animation_time) {
        div_class.each(function(i) {
            // if card exists:
            if (cards_to_render[i]){
                $(this).show(animation_time);
            // else hide the element:
            } else {
                $(this).hide(animation_time);
            }
    });
    }
    // apply the 'flipped' class to each flashcard upon click.
    // the 'flipped' class applies the flip along the y axis for the respective css card.
    flash_class.each(function(i){
        $(this).on('click', function() {
            this.classList.toggle('flipped');
        });
    });

    function reset_flips() {
        flash_class.each(function(i){
            if (flipped[i]) {
                this.classList.toggle('flipped');
            }
        });
        flipped.fill(false);
    }
});