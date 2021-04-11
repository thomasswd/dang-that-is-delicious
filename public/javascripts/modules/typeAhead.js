import axios from 'axios'
import dompurify from 'dompurify'

function searchResultsHTML(stores) {
    //return a link tag for each store 
    return stores.map(store => {
        return `
            <a href="/store/${store.slug}" class="search__result">
                <strong> ${store.name} </strong>
            </a>
        `;
    }).join('');

}

function typeAhead(search) {

    //if there is no search
    if(!search) {
        return
    }

    const searchInput = search.querySelector('input[name="search"]');
    const searchResults = search.querySelector('.search__results')

    searchInput.on('input', function() {
        //if there are no values from the input field, then don't display the result

        if(!this.value) {
            searchResults.style.display = 'none';
            return;
        }

        //set the default display property to block
        searchResults.style.display = 'block';
        //searchResults.innerHTML = '';

        //fetch data from the url with query including the value
        axios.get(`/api/search?q=${this.value}`)
        .then(res => {
            //if there is any data from the response (any stores with names that match the search query)
            //call function to return html string and set to the inner html of search results
            console.log(res.data)
            if(res.data.length) {
                searchResults.innerHTML = searchResultsHTML(res.data)
                return;
            }
            searchResults.innerHTML = dompurify.sanitize(`<div class="search__result">No results for ${this.value} </div>`)

        }).catch(err => {
            console.log("error")
        })

    });

    searchInput.on('keyup', e => {
        //check if the key code entered is one of the codes in the array
        if(![40, 38, 13].includes(e.keyCode)) {
            return;
        }

        //set the active class for the search results for keyboard input
        const activeClass = "search__result--active";
        const current = search.querySelector(`.${activeClass}`);
        const items = search.querySelectorAll('.search__result');
        let next;

        console.log(e.keyCode)

        //40 is down, 38 is  up, 13 is enter
        if(e.keyCode === 40 && current) {
            //if down is pressed when there is an active item
            next = current.nextElementSibling || items[0];
        } else if(e.keyCode === 40) {
            //if down is pressed when there isnt an active item
            next = items[0]
            console.log(next)
        } else if(e.keyCode === 38 && current) {
            next = current.previousElementSibling || items[items.length - 1];
        } else if(e.keyCode === 38) {
            next = items[items.length - 1];
        } else if(e.keyCode === 13 && current.href) {
            window.location = current.href;
            return;
        }

        if(current) {
            current.classList.remove(activeClass);
        }
        next.classList.add(activeClass)
    })
}

export default typeAhead;