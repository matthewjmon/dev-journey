
function displaySuggestions() {
    fetch('https://www.themealdb.com/api/json/v1/1/list.php?i=')
        .then(response => response.json())
        .then(data => {
            console.log(data)
            });
        }

        displaySuggestions()




    

   