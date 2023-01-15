function fetch_delete(entry) {
  // send the ajax request:
  fetch(`${window.origin}/flash_c`, {
      method: "POST",
      credentials: "omit",
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
              console.log("This is data: " )
              console.log(data)
              // hide and show entire flash card according to number of entries available:
              flash_class.each(function(i) {
                  // if question available:
                  if (data[i]){
                      $(this).show(200);
                  // else hide the element:
                  } else {
                      $(this).hide(200);
                  }
              });
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