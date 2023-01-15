$(function() {

    $("#submit").on('click', function(event) {
        // prevent page refresh upon submission
        event.preventDefault();
        // collect form values:
        typed = $("#category_typed").val();
        if (typed === '') {
            typed = "."
        }
        select = $("#category-select").val();
        question = $("#question").val();
        answer = $("#answer").val();

        // collate into a dictonary:
        let entry = {
            "typed": typed,
            "select": select,
            "question": question,
            "answer": answer
        };

        // send as JSON object to back-end:
        fetch_request(entry);
    });

    // add starter deck upon button click
    $("#starter").on('click', function(event) {
        event.preventDefault();

        let entry = {
            "typed": "not-null",
            "select": "add starter deck",
            "question": "not-null",
            "answer": "not-null"
        };

        // send as JSON object to back-end:
        fetch_request(entry);
    });

    function fetch_request(entry) {
        // send the ajax request:
        fetch(`${window.origin}/add_card`, {
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
                    categories = {};
                    if (data.message) {
                        // display error message to user
                        $("#message").html(`${data.message}`);
                    }
                    else if (data.category) {
                        // clear any pre-existing error messages
                        $("#message").html("");

                        // append a new message to the DOM, informing the user of the successful upload
                        const p = document.createElement("p");
                        const node = document.createTextNode(`A new card was added to the category ${data.category}`);
                        p.appendChild(node);
                        const messages = document.getElementById("messages");
                        messages.appendChild(p);
                    }
                    
                    
                });
            }
        });
    };
});