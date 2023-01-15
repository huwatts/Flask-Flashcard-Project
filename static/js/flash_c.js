$(function() {
    const flash_class = $('.flash_card');

    // an array to keep track of flipped cards:
    const flipped = [];

    // an array to store q and a and other card meta data
    // This is neccessary as event listeners will cause memory problems with the raw json file
    flashqa = [];
    important = 0;

    // fetch request upon intial page load
    let inital_entry = {
        "category": "all",
        "delete": ".",
        "important": important,
        "imp_id" : "."
    }
    fetch_request(inital_entry)

    // event listener for the "important" checkbox
    $('#slider').on('change', function() {
        if ($(this).prop('checked')) {
            important = 1;
        } else {
            important = 0;
        }
        let category = $('select[name="category"]').val();
        let entry = {
            "category": category,
            "delete": ".",
            "important": important,
            "imp_id": "."
        }
        fetch_request(entry);
        });
 
    // Event listener for change of category:
    $('select[name="category"]').on('change', function() {
        let category = $(this).val();
        let entry = {
            "category": category,
            "delete": ".",
            "important": important,
            "imp_id" : "."
        }
        // send a fetch request with the selected category:
        fetch_request(entry);
    });

    // event listeners for flash card flip:
    flash_class.each(function(i) {
        $(this).on('click', function() {
            if (flipped[i]) {
                $(this).html(flashqa[i].question);
                $(this).css("background-color","#7494b8");
                flipped[i] = false;
                $('.flash_card').css('border-style', 'none');
                $(this).css('border-style', 'solid');
                selected = $(this);
            } else {
                $(this).html(flashqa[i].answer);
                $(this).css("background-color",'#aaa986');
                flipped[i] = true;
                $('.flash_card').css('border-style', 'none');
                $(this).css('border-style', 'solid');
                selected = $(this);
            }
        })
    })

    let clicked
    // event listeners to allow cards to be deleted
    // or marked as important:
    for (let i = 0; i < 20; i++) {
        let div = $(`#flash-${i}`);
        div.on('click', function(event) {
            clicked = flashqa[i].id;
        });
      }

    let turn_off_animations = false
    // add event listener to the delete button
    $("#delete_card").on('click', function(event) {
        event.preventDefault();
        if (clicked) {
            entry = {
                "category": $('select[name="category"]').val(),
                "delete": clicked,
                "important": important,
                "imp_id" : "."
            }
            turn_off_animations = true
            fetch_request(entry)
        }
    });

    // add event listener to the "important" button
    $("#imp").on('click', function(event) {
        event.preventDefault();
        if (clicked) {
            entry = {
                "category": $('select[name="category"]').val(),
                "delete": ".",
                "important": important,
                "imp_id" : clicked
            }
            turn_off_animations = true
            fetch_request(entry)
        }
    });



    function fetch_request(entry) {
        // send the ajax request:
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
                    flashqa = data
                    // reset flips to track background color:
                    for (let i = 0; i < flashqa.length; i++) {
                        flipped.push(false);
                        }
                    // hide and show entire flash card according to number of entries available:
                    if (turn_off_animations) {
                        // skip the animations if it is a delete request
                        flash_class.each(function(i) {
                            // if question available:
                            if (data[i]){
                                $(this).show();
                            // else hide the element:
                            } else {
                                $(this).hide();
                            }
                            // turn animations back on for next time:
                            turn_off_animations = false
                        })
                    } else {
                        // add animation if not a delete request
                        flash_class.each(function(i) {
                            // if question available:
                            if (data[i]){
                                $(this).show(200);
                            // else hide the element:
                            } else {
                                $(this).hide(200);
                            }
                    })};
                    // reset the flipped array:
                    flipped.fill(false);
                    // fill flash cards with new questions:
                    flash_class.each(function(i) {
                        if (data[i]){
                            $(this).html(data[i].question);
                            $(this).css("background-color","#7494b8");
                        }
                    });
                })
            }
        })
    };
});